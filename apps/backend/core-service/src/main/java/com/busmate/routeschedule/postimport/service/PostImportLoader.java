package com.busmate.routeschedule.postimport.service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.network.dto.request.RouteRequest;
import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.dto.response.StopResponse;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.enums.StopListCompletenessEnum;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.network.service.RouteService;
import com.busmate.routeschedule.network.service.StopService;
import com.busmate.routeschedule.postimport.dto.DraftResolutionRequest;
import com.busmate.routeschedule.postimport.dto.LoadResult;
import com.busmate.routeschedule.postimport.dto.ResolvedRow;
import com.busmate.routeschedule.postimport.dto.RowAction;
import com.busmate.routeschedule.postimport.dto.RowLoadResult;
import com.busmate.routeschedule.postimport.dto.RowLoadStatus;
import com.busmate.routeschedule.scheduling.dto.request.ScheduleRequest;
import com.busmate.routeschedule.scheduling.dto.request.ScheduleRequest.ScheduleStopRequest;
import com.busmate.routeschedule.scheduling.dto.request.ScheduleWorkingRequest;
import com.busmate.routeschedule.scheduling.dto.request.ScheduleWorkingRequest.VehicleClaim;
import com.busmate.routeschedule.scheduling.dto.response.ScheduleResponse;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.enums.TimingCompletenessEnum;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleWorkingRepository;
import com.busmate.routeschedule.scheduling.service.ScheduleWorkingService;
import com.busmate.routeschedule.scheduling.service.ScheduleService;
import com.busmate.routeschedule.shared.dto.LocationDto;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.busmate.routeschedule.shared.security.Caller;

/**
 * Loads an approved draft's rows into real BusMate data, the same way staff already can by hand (ADR-025):
 * writes go directly through {@link StopService}/{@link RouteService}/{@link ScheduleService}/
 * {@link ScheduleWorkingService} as the calling staff member, stamped {@code SRC_5} and dated to the post.
 * No changeset — this project's changeset system has no entity type for a route or a schedule, and a
 * second-approver review would be wrong here anyway: staff already reviewed this inside the draft screen.
 *
 * <p>Each row loads in its own transaction. A slow or failing row must never roll back the rows already
 * written beside it — the same reasoning that keeps {@link PostImportService#create} out of a transaction
 * for its external AI call, applied here to one row's chain of creates instead.
 */
@Component
public class PostImportLoader {

    private static final Pattern TIME_24H = Pattern.compile("^([01]?\\d|2[0-3])[:.]([0-5]\\d)$");
    private static final Pattern TIME_12H = Pattern.compile("^([1-9]|1[0-2])[:.]([0-5]\\d)\\s*([ap]m)$",
            Pattern.CASE_INSENSITIVE);

    private final StopRepository stopRepository;
    private final StopService stopService;
    private final RouteRepository routeRepository;
    private final RouteService routeService;
    private final ScheduleRepository scheduleRepository;
    private final ScheduleService scheduleService;
    private final ScheduleWorkingRepository workingRepository;
    private final ScheduleWorkingService scheduleWorkingService;
    private final TransactionTemplate perRowTransaction;

    public PostImportLoader(StopRepository stopRepository, StopService stopService, RouteRepository routeRepository,
            RouteService routeService, ScheduleRepository scheduleRepository, ScheduleService scheduleService,
            ScheduleWorkingRepository workingRepository, ScheduleWorkingService scheduleWorkingService,
            PlatformTransactionManager transactionManager) {
        this.stopRepository = stopRepository;
        this.stopService = stopService;
        this.routeRepository = routeRepository;
        this.routeService = routeService;
        this.scheduleRepository = scheduleRepository;
        this.scheduleService = scheduleService;
        this.workingRepository = workingRepository;
        this.scheduleWorkingService = scheduleWorkingService;
        this.perRowTransaction = new TransactionTemplate(transactionManager);
        this.perRowTransaction.setPropagationBehavior(
                org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public LoadResult load(Caller staff, DraftResolutionRequest resolution) {
        int stopsCreated = 0;
        int routesCreated = 0;
        int schedulesCreated = 0;
        int workingsCreated = 0;
        List<RowLoadResult> rowResults = new ArrayList<>();

        for (ResolvedRow row : resolution.rows()) {
            if (row.action() == RowAction.SKIP) {
                rowResults.add(new RowLoadResult(row.sourceIndex(), RowLoadStatus.SKIPPED, "Marked skip by staff"));
                continue;
            }
            try {
                RowOutcome outcome = perRowTransaction.execute(status -> loadRow(staff, resolution, row));
                stopsCreated += outcome.stopsCreated;
                routesCreated += outcome.routesCreated;
                schedulesCreated += outcome.schedulesCreated;
                workingsCreated += outcome.workingCreated ? 1 : 0;
                rowResults.add(new RowLoadResult(row.sourceIndex(), outcome.status, outcome.detail));
            } catch (Exception e) {
                rowResults.add(new RowLoadResult(row.sourceIndex(), RowLoadStatus.FAILED, e.getMessage()));
            }
        }
        return new LoadResult(stopsCreated, routesCreated, schedulesCreated, workingsCreated, rowResults);
    }

    private RowOutcome loadRow(Caller staff, DraftResolutionRequest resolution, ResolvedRow row) {
        if (isBlank(row.time()) || isBlank(row.origin()) || isBlank(row.destination())) {
            throw new BadRequestException("Needs a time, an origin and a destination to load");
        }
        LocalTime departureTime = parseTime(row.time());
        if (departureTime == null) {
            throw new BadRequestException("Couldn't read \"" + row.time() + "\" as a time");
        }

        StopOutcome origin = resolveStop(row.originStopId(), row.origin(), staff, resolution);
        StopOutcome destination = resolveStop(row.destinationStopId(), row.destination(), staff, resolution);
        RouteOutcome route = resolveRoute(row.origin(), row.destination(), origin.stopId(), destination.stopId(), staff, resolution);
        ScheduleOutcome schedule = resolveSchedule(row, departureTime, route.routeId(), origin.stopId(), staff, resolution);
        boolean workingCreated = resolveWorking(row, schedule.scheduleId(), staff, resolution);

        int stopsCreated = (origin.created() ? 1 : 0) + (destination.created() ? 1 : 0);
        boolean anythingCreated = stopsCreated > 0 || route.created() || schedule.created() || workingCreated;
        String detail = anythingCreated
                ? "Loaded" + (schedule.created() ? "" : " (schedule already existed)")
                : "Already there — nothing new to load";
        return new RowOutcome(anythingCreated ? RowLoadStatus.CREATED : RowLoadStatus.ALREADY_THERE, detail,
                stopsCreated, route.created() ? 1 : 0, schedule.created() ? 1 : 0, workingCreated);
    }

    private StopOutcome resolveStop(UUID explicitStopId, String placeName, Caller staff, DraftResolutionRequest resolution) {
        if (explicitStopId != null) {
            if (!stopRepository.existsById(explicitStopId)) {
                throw new ResourceNotFoundException("No stop " + explicitStopId);
            }
            return new StopOutcome(explicitStopId, false);
        }
        Optional<Stop> existing = stopRepository.findByAnyNameVariant(placeName);
        if (existing.isPresent()) {
            return new StopOutcome(existing.get().getId(), false);
        }

        StopRequest request = new StopRequest();
        request.setName(placeName);
        LocationDto location = new LocationDto();
        location.setCity(placeName);
        location.setCountry("Sri Lanka");
        request.setLocation(location);
        request.setSourceTier(SourceTier.SRC_5);
        request.setAttributionLabel(resolution.sourceLabel());
        request.setObservedOn(resolution.observedOn());
        StopResponse created = stopService.createStop(request, staff.auditId());
        return new StopOutcome(created.getId(), true);
    }

    private RouteOutcome resolveRoute(String origin, String destination, UUID originStopId, UUID destinationStopId,
            Caller staff, DraftResolutionRequest resolution) {
        String routeName = origin + " to " + destination;
        Optional<Route> existing = routeRepository.findByNameAndRouteGroupIsNull(routeName);
        if (existing.isPresent()) {
            return new RouteOutcome(existing.get().getId(), false);
        }

        RouteRequest request = new RouteRequest();
        request.setName(routeName);
        request.setStartStopId(originStopId);
        request.setEndStopId(destinationStopId);
        request.setStopListCompleteness(StopListCompletenessEnum.PARTIAL);
        request.setSourceTier(SourceTier.SRC_5);
        request.setAttributionLabel(resolution.sourceLabel());
        request.setObservedOn(resolution.observedOn());
        RouteResponse created = routeService.createRoute(request, staff.auditId());
        return new RouteOutcome(created.getId(), true);
    }

    private ScheduleOutcome resolveSchedule(ResolvedRow row, LocalTime departureTime, UUID routeId, UUID originStopId,
            Caller staff, DraftResolutionRequest resolution) {
        String scheduleName = row.time() + " " + (isBlank(row.operatorName()) ? "departure" : row.operatorName());
        Schedule existing = scheduleRepository.findByNameAndRoute_Id(scheduleName, routeId);
        if (existing != null) {
            return new ScheduleOutcome(existing.getId(), false);
        }

        ScheduleRequest request = new ScheduleRequest();
        request.setName(scheduleName);
        request.setRouteId(routeId);
        request.setScheduleType("REGULAR");
        request.setEffectiveStartDate(resolution.observedOn());
        request.setTimingCompleteness(TimingCompletenessEnum.ORIGIN_ONLY);
        request.setDescription(describe(row));
        request.setGenerateTrips(false);
        request.setSourceTier(SourceTier.SRC_5);
        request.setAttributionLabel(resolution.sourceLabel());
        request.setObservedOn(resolution.observedOn());

        ScheduleStopRequest stopRequest = new ScheduleStopRequest();
        stopRequest.setStopId(originStopId);
        stopRequest.setStopOrder(0);
        stopRequest.setDepartureTimeUnverified(departureTime);
        stopRequest.setDepartureTimeUnverifiedBy(resolution.sourceLabel());
        request.setScheduleStops(List.of(stopRequest));

        ScheduleResponse created = scheduleService.createScheduleFull(request, staff.auditId());
        return new ScheduleOutcome(created.getId(), true);
    }

    private boolean resolveWorking(ResolvedRow row, UUID scheduleId, Caller staff, DraftResolutionRequest resolution) {
        if (!workingRepository.findAllForSchedule(scheduleId).isEmpty()) {
            return false;
        }
        boolean hasPlates = row.plates() != null && !row.plates().isEmpty();
        if (isBlank(row.operatorName()) && !hasPlates && mapServiceClass(row.serviceClass()) == null) {
            return false;
        }

        List<VehicleClaim> vehicles = hasPlates
                ? row.plates().stream().map(plate -> new VehicleClaim(null, plate)).toList()
                : List.of();
        ScheduleWorkingRequest request = new ScheduleWorkingRequest(resolution.observedOn(), null, null,
                isBlank(row.operatorName()) ? null : row.operatorName(), mapServiceClass(row.serviceClass()),
                vehicles, SourceTier.SRC_5, resolution.sourceLabel(), resolution.observedOn());
        scheduleWorkingService.create(scheduleId, request, staff.auditId());
        return true;
    }

    /** "From the post, dated <date>." then the row's own note, then whether it states operating days. */
    private String describe(ResolvedRow row) {
        StringBuilder sb = new StringBuilder("From a community timetable post.");
        if (!isBlank(row.notes())) {
            sb.append(" Post note: ").append(row.notes());
        }
        if (!isBlank(row.days())) {
            sb.append(" Days as stated in the post: ").append(row.days())
                    .append(" — not represented as a calendar; read literally, not parsed.");
        } else {
            sb.append(" Operating days are not stated in the post, so none are recorded.");
        }
        return sb.toString();
    }

    private ServiceClassEnum mapServiceClass(String text) {
        if (isBlank(text)) {
            return null;
        }
        String t = text.toLowerCase(Locale.ROOT);
        if (t.contains("super") && t.contains("luxury")) {
            return ServiceClassEnum.SUPER_LUXURY;
        }
        if (t.contains("semi") && t.contains("luxury")) {
            return ServiceClassEnum.SEMI_LUXURY;
        }
        if (t.contains("luxury")) {
            return ServiceClassEnum.LUXURY;
        }
        if (t.contains("normal")) {
            return ServiceClassEnum.NORMAL;
        }
        return null;
    }

    private LocalTime parseTime(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        Matcher m24 = TIME_24H.matcher(t);
        if (m24.matches()) {
            return LocalTime.of(Integer.parseInt(m24.group(1)), Integer.parseInt(m24.group(2)));
        }
        Matcher m12 = TIME_12H.matcher(t);
        if (m12.matches()) {
            int hour = Integer.parseInt(m12.group(1)) % 12;
            if (m12.group(3).equalsIgnoreCase("pm")) {
                hour += 12;
            }
            return LocalTime.of(hour, Integer.parseInt(m12.group(2)));
        }
        return null;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private record RowOutcome(RowLoadStatus status, String detail, int stopsCreated, int routesCreated,
            int schedulesCreated, boolean workingCreated) {
    }

    private record StopOutcome(UUID stopId, boolean created) {
    }

    private record RouteOutcome(UUID routeId, boolean created) {
    }

    private record ScheduleOutcome(UUID scheduleId, boolean created) {
    }
}
