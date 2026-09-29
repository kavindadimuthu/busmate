"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@busmate/ui";
import type { ContributorRow } from "@/hooks/mot/community/useContributors";

interface StewardSectionProps {
  contributor: ContributorRow;
  /** Every route group, for the picker and to turn the stored ids back into names. */
  routeGroups: { id: string; name: string }[];
  onAppoint: (userId: string, routeGroupIds: string[]) => Promise<boolean>;
  onRevoke: (userId: string) => Promise<boolean>;
  actionLoading: boolean;
}

/**
 * Staff appoint an active contributor as a steward for chosen corridors, change those corridors, or
 * revoke (ADR-022). A steward reviews other people's proposals inside their corridors only; this is
 * the only place anyone becomes one, and it is always a human decision.
 */
export function StewardSection({ contributor, routeGroups, onAppoint, onRevoke, actionLoading }: StewardSectionProps) {
  const [open, setOpen] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);

  const isSteward = contributor.level === "STEWARD";
  const scope = contributor.stewardScopeRouteGroupIds ?? [];
  const nameOf = (id: string) => routeGroups.find((g) => g.id === id)?.name ?? "A corridor that no longer exists";

  // A declared corridor is a sensible starting suggestion for a first appointment; an existing scope wins.
  const openDialog = () => {
    setChosen(isSteward ? scope : (contributor.corridorRouteGroupIds ?? []));
    setOpen(true);
  };

  const toggle = (id: string, on: boolean) => setChosen((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));

  const save = async () => {
    if (!contributor.userId || chosen.length === 0) return;
    if (await onAppoint(contributor.userId, chosen)) setOpen(false);
  };

  const revoke = async () => {
    if (!contributor.userId) return;
    if (await onRevoke(contributor.userId)) setConfirmRevoke(false);
  };

  return (
    <div className="border-t border-border pt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" /> Steward
      </p>
      {isSteward ? (
        <>
          <p className="text-sm text-foreground">Reviews proposals in {scope.length} corridor(s):</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5">
            {scope.map((id) => (
              <li key={id}>{nameOf(id)}</li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={openDialog} disabled={actionLoading}>
              Change corridors
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setConfirmRevoke(true)} disabled={actionLoading}>
              Revoke
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            A plain contributor. A steward reviews other contributors' proposals in the corridors you choose.
          </p>
          <Button size="sm" onClick={openDialog} disabled={actionLoading}>
            Appoint as steward
          </Button>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSteward ? "Change steward corridors" : "Appoint as steward"}</DialogTitle>
            <DialogDescription>
              They will approve or reject proposals in these corridors, without seeing who made them. You can
              revoke this at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 py-1">
            {routeGroups.length === 0 && <p className="text-sm text-muted-foreground">No corridors to choose from.</p>}
            {routeGroups.map((g) => (
              <div key={g.id} className="flex items-center gap-2">
                <Checkbox
                  id={`steward-${g.id}`}
                  checked={chosen.includes(g.id)}
                  onCheckedChange={(v) => toggle(g.id, v === true)}
                />
                <Label htmlFor={`steward-${g.id}`} className="text-sm">
                  {g.name}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={chosen.length === 0 || actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke stewardship?</DialogTitle>
            <DialogDescription>
              They stay an active contributor but can no longer review anyone's proposals. This takes effect on
              their next request.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevoke(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={revoke} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
