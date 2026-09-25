import type { ChangesetResponse, ScheduleWorkingContext } from "@busmate/api-client-core";
import type { WorkingValues } from "@/lib/proposalLabel";

const CLASS_LABEL: Record<string, string> = {
  NORMAL: "Normal",
  SEMI_LUXURY: "Semi-luxury",
  LUXURY: "Luxury",
  SUPER_LUXURY: "Super luxury",
  EXPRESSWAY_SUPER_LUXURY: "Expressway super luxury",
};

/** What a working proposal says, and — for a reviewer — who is already recorded on that departure. */
export default function WorkingProposalDetail({
  changeset,
  context,
}: {
  changeset?: ChangesetResponse;
  context?: ScheduleWorkingContext;
}) {
  const w = (changeset?.proposedValues ?? {}) as WorkingValues;
  const plates = (w.platesObserved ?? []).filter(Boolean);
  return (
    <div className="space-y-3 text-sm" data-testid="working-proposal">
      {context && (
        <p>
          <span className="text-muted-foreground">Departure: </span>
          {[context.routeNumber, context.routeName].filter(Boolean).join(" · ")}
          {context.scheduleName ? ` — ${context.scheduleName}` : ""}
        </p>
      )}
      <p>
        <span className="text-muted-foreground">Operator: </span>
        {w.operatorNameObserved || "not stated"}
      </p>
      <p>
        <span className="text-muted-foreground">{plates.length > 1 ? "Plates (alternating): " : "Plate: "}</span>
        {plates.length ? plates.join(" or ") : "not stated"}
      </p>
      {w.serviceClass && (
        <p>
          <span className="text-muted-foreground">Service class: </span>
          {CLASS_LABEL[w.serviceClass] ?? w.serviceClass}
        </p>
      )}
      {context && (
        <div className="border-t border-border pt-3">
          <p className="text-muted-foreground mb-1">Already recorded on this departure</p>
          {(context.currentWorkings ?? []).length === 0 ? (
            <p>Nobody yet.</p>
          ) : (
            <ul className="space-y-1">
              {context.currentWorkings!.map((c) => (
                <li key={c.id}>
                  {c.operatorName ?? c.operatorNameObserved ?? "Operator not stated"}
                  {c.vehicles?.length ? ` · ${c.vehicles.map((v) => v.plate ?? v.plateObserved).join(" or ")}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
