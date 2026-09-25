import type { ChangesetResponse, ScheduleWorkingContext } from '@busmate/api-client-core';
import type { WorkingValues } from './proposalLabel';

/** A working proposal beside who is already recorded on that departure (INC-052). */
export function WorkingProposalDiff({ changeset, context }: { changeset?: ChangesetResponse; context?: ScheduleWorkingContext }) {
  const w = (changeset?.proposedValues ?? {}) as WorkingValues;
  const plates = (w.platesObserved ?? []).filter(Boolean);
  return (
    <div className="space-y-3 text-sm" data-testid="working-proposal">
      {context && (
        <p>
          <span className="text-muted-foreground">Departure: </span>
          {[context.routeNumber, context.routeName].filter(Boolean).join(' · ')}
          {context.scheduleName ? ` — ${context.scheduleName}` : ''}
        </p>
      )}
      <p><span className="text-muted-foreground">Operator: </span>{w.operatorNameObserved || 'not stated'}</p>
      <p>
        <span className="text-muted-foreground">{plates.length > 1 ? 'Plates (alternating): ' : 'Plate: '}</span>
        {plates.length ? plates.join(' or ') : 'not stated'}
      </p>
      {w.serviceClass && <p><span className="text-muted-foreground">Service class: </span>{w.serviceClass.replace(/_/g, ' ')}</p>}
      {context && (
        <div className="border-t border-border pt-3">
          <p className="text-muted-foreground mb-1">Already recorded on this departure</p>
          {(context.currentWorkings ?? []).length === 0 ? (
            <p>Nobody yet.</p>
          ) : (
            <ul className="space-y-1">
              {context.currentWorkings!.map((c) => (
                <li key={c.id}>
                  {c.operatorName ?? c.operatorNameObserved ?? 'Operator not stated'}
                  {c.vehicles?.length ? ` · ${c.vehicles.map((v) => v.plate ?? v.plateObserved).join(' or ')}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
