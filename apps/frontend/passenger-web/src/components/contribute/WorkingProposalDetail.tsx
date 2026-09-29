import type { ChangesetResponse, ScheduleWorkingContext } from "@busmate/api-client-core";
import type { WorkingValues } from "@/lib/proposalLabel";

const CLASS_LABEL: Record<string, string> = {
  NORMAL: "Normal",
  SEMI_LUXURY: "Semi-luxury",
  LUXURY: "Luxury",
  SUPER_LUXURY: "Super luxury",
  EXPRESSWAY_SUPER_LUXURY: "Expressway super luxury",
};

type Snapshot = {
  operatorName?: string;
  operatorNameObserved?: string;
  serviceClass?: string;
  effectiveEndDate?: string;
  vehicles?: { plate?: string; plateObserved?: string }[];
};

function classLabel(v?: string): string {
  return v ? CLASS_LABEL[v] ?? v : "not stated";
}

function DiffRow({ label, before, after }: { label: string; before: string; after: string }) {
  if (before === after) {
    return (
      <p>
        <span className="text-muted-foreground">{label}: </span>
        {after}
      </p>
    );
  }
  return (
    <p>
      <span className="text-muted-foreground">{label}: </span>
      <span className="line-through text-muted-foreground">{before}</span>
      <span className="mx-1">→</span>
      <span className="font-medium">{after}</span>
    </p>
  );
}

/** What a working proposal says, and — for a reviewer — who is already recorded on that departure. */
export default function WorkingProposalDetail({
  changeset,
  context,
}: {
  changeset?: ChangesetResponse;
  context?: ScheduleWorkingContext;
}) {
  const proposed = (changeset?.proposedValues ?? {}) as WorkingValues & { effectiveEndDate?: string };
  const isCorrection = changeset?.action === "UPDATE";
  const before = (changeset?.targetSnapshot ?? {}) as Snapshot;
  const afterPlates = (proposed.platesObserved ?? []).filter(Boolean);
  const beforePlates = (before.vehicles ?? []).map((v) => v.plateObserved ?? v.plate ?? "").filter(Boolean);

  return (
    <div className="space-y-3 text-sm" data-testid="working-proposal">
      {context && (
        <p>
          <span className="text-muted-foreground">Departure: </span>
          {[context.routeNumber, context.routeName].filter(Boolean).join(" · ")}
          {context.scheduleName ? ` — ${context.scheduleName}` : ""}
        </p>
      )}
      {isCorrection ? (
        <>
          <DiffRow label="Operator" before={before.operatorNameObserved ?? before.operatorName ?? "not stated"} after={proposed.operatorNameObserved || "not stated"} />
          <DiffRow
            label={afterPlates.length > 1 || beforePlates.length > 1 ? "Plates (alternating)" : "Plate"}
            before={beforePlates.length ? beforePlates.join(" or ") : "not stated"}
            after={afterPlates.length ? afterPlates.join(" or ") : "not stated"}
          />
          <DiffRow label="Service class" before={classLabel(before.serviceClass)} after={classLabel(proposed.serviceClass)} />
          {proposed.effectiveEndDate && (
            <p className="text-destructive">
              <span className="text-muted-foreground">Claims it stopped: </span>
              {proposed.effectiveEndDate}
            </p>
          )}
        </>
      ) : (
        <>
          <p>
            <span className="text-muted-foreground">Operator: </span>
            {proposed.operatorNameObserved || "not stated"}
          </p>
          <p>
            <span className="text-muted-foreground">{afterPlates.length > 1 ? "Plates (alternating): " : "Plate: "}</span>
            {afterPlates.length ? afterPlates.join(" or ") : "not stated"}
          </p>
          {proposed.serviceClass && (
            <p>
              <span className="text-muted-foreground">Service class: </span>
              {classLabel(proposed.serviceClass)}
            </p>
          )}
        </>
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
