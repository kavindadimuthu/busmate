"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, MapPin, Shield } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Label,
} from "@busmate/ui";
import type { ContributorRow } from "@/hooks/mot/community/useContributors";

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

const AFFILIATION_LABEL: Record<string, string> = {
  NONE: "No link to any operator",
  OPERATOR_EMPLOYEE: "Works for a bus operator",
  BUS_OWNER: "Owns or runs buses",
  OTHER: "Some other connection",
};

type ReasonAction = "decline" | "suspend";

interface ContributorDetailDrawerProps {
  contributor: ContributorRow | null;
  onClose: () => void;
  onAccept: (userId: string) => Promise<boolean>;
  onDecline: (userId: string, reason: string) => Promise<boolean>;
  onSuspend: (userId: string, reason: string) => Promise<boolean>;
  onReinstate: (userId: string) => Promise<boolean>;
  actionLoading: boolean;
}

/**
 * The reviewer's view of one application: what they said, when, and their affiliation — always
 * shown, since a reviewer needs it before trusting anything else on the page.
 */
export function ContributorDetailDrawer({
  contributor,
  onClose,
  onAccept,
  onDecline,
  onSuspend,
  onReinstate,
  actionLoading,
}: ContributorDetailDrawerProps) {
  const [reasonDialog, setReasonDialog] = useState<ReasonAction | null>(null);
  const [reason, setReason] = useState("");

  if (!contributor) return null;

  const submitReason = async () => {
    if (!contributor.userId || !reason.trim()) return;
    const ok =
      reasonDialog === "decline"
        ? await onDecline(contributor.userId, reason.trim())
        : await onSuspend(contributor.userId, reason.trim());
    if (ok) {
      setReasonDialog(null);
      setReason("");
    }
  };

  return (
    <>
      <Sheet open={!!contributor} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{contributor.account?.fullName ?? "Applicant"}</SheetTitle>
            <SheetDescription>{contributor.account?.email ?? contributor.userId}</SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant={contributor.status === "ACTIVE" ? "default" : "secondary"}>{contributor.status}</Badge>
              {contributor.affiliation && contributor.affiliation !== "NONE" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-warning/10 text-warning border border-warning/20">
                  <AlertTriangle className="h-3 w-3" /> {AFFILIATION_LABEL[contributor.affiliation]}
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Why they want to contribute</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{contributor.motivation}</p>
            </div>

            {contributor.affiliation !== "NONE" && contributor.affiliationDetail && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Affiliation detail</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{contributor.affiliationDetail}</p>
              </div>
            )}

            {contributor.homeDistrict && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Home district</p>
                <p className="text-sm text-foreground">{contributor.homeDistrict}</p>
              </div>
            )}

            {!!contributor.corridorRouteGroupIds?.length && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Corridors they know
                </p>
                <p className="text-sm text-foreground">{contributor.corridorRouteGroupIds.length} corridor(s) selected</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t border-border pt-3">
              <div>
                <p className="font-medium text-foreground/80">Applied</p>
                <p>{formatDate(contributor.appliedAt)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground/80 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Agreement
                </p>
                <p>
                  {contributor.agreementVersion}
                  {contributor.agreementCurrent === false && " (out of date)"}
                </p>
              </div>
            </div>

            {contributor.decidedAt && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Last decision</p>
                <p className="text-sm text-foreground">{formatDate(contributor.decidedAt)}</p>
                {contributor.decisionReason && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    "{contributor.decisionReason}"
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {contributor.status === "APPLIED" && (
                <>
                  <Button
                    onClick={() => contributor.userId && onAccept(contributor.userId)}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Accept
                  </Button>
                  <Button variant="outline" onClick={() => setReasonDialog("decline")} disabled={actionLoading}>
                    Decline
                  </Button>
                </>
              )}
              {contributor.status === "ACTIVE" && (
                <Button variant="destructive" onClick={() => setReasonDialog("suspend")} disabled={actionLoading}>
                  Suspend
                </Button>
              )}
              {contributor.status === "SUSPENDED" && (
                <Button onClick={() => contributor.userId && onReinstate(contributor.userId)} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Reinstate
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!reasonDialog} onOpenChange={(open) => !open && setReasonDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reasonDialog === "decline" ? "Decline application" : "Suspend contributor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="community-reason">Reason (the applicant will see this)</Label>
            <Textarea
              id="community-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this application being declined or suspended?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submitReason} disabled={!reason.trim() || actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
