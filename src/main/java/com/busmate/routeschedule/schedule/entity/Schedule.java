package com.busmate.routeschedule.schedule.entity;

import com.busmate.routeschedule.schedule.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.schedule.enums.ScheduleStatusEnum; // New import
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.common.entity.BaseEntity;
import com.busmate.routeschedule.route.entity.Route;
import com.busmate.routeschedule.schedule.enums.ScheduleStatusEnum;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "schedule")
public class Schedule extends BaseEntity {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @Column(nullable = false)
    private String name;

    // Add description field
    @Column
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false)
    private ScheduleTypeEnum scheduleType;

    @Column(name = "effective_start_date", nullable = false)
    private LocalDate effectiveStartDate;

    @Column(name = "effective_end_date")
    private LocalDate effectiveEndDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ScheduleStatusEnum status; // Changed to ScheduleStatusEnum

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleStop> scheduleStops;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleCalendar> scheduleCalendars;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleException> scheduleExceptions;
}
