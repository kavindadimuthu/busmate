import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  CommunityContributorsService,
  RouteManagementService,
  type ContributorAgreementResponse,
  type ContributorApplicationRequest,
  type MyContributorStandingResponse,
  type RouteGroupResponse,
} from "@busmate/api-client-core";
import { useAuth } from "@/lib/auth/AuthContext";

const applicationSchema = z
  .object({
    motivation: z.string().trim().min(20, "Say a bit more — at least 20 characters").max(1000),
    homeDistrict: z.string().trim().max(100).optional(),
    corridorRouteGroupIds: z.array(z.string()).max(20),
    affiliation: z.enum(["NONE", "OPERATOR_EMPLOYEE", "BUS_OWNER", "OTHER"]),
    affiliationDetail: z.string().trim().max(500).optional(),
    agreementAccepted: z.boolean(),
  })
  .refine((v) => v.affiliation === "NONE" || (v.affiliationDetail && v.affiliationDetail.length > 0), {
    message: "Tell us which operator, and how you're linked to them",
    path: ["affiliationDetail"],
  })
  .refine((v) => v.agreementAccepted, {
    message: "You need to accept the agreement to apply",
    path: ["agreementAccepted"],
  });

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const AFFILIATION_OPTIONS: { value: ApplicationFormValues["affiliation"]; label: string }[] = [
  { value: "NONE", label: "No link to any bus operator" },
  { value: "OPERATOR_EMPLOYEE", label: "I work for a bus operator" },
  { value: "BUS_OWNER", label: "I own or run buses" },
  { value: "OTHER", label: "Some other connection" },
];

const REASON_TEXT: Record<string, string> = {
  NOT_A_PASSENGER: "Only passenger accounts can apply to contribute.",
  EMAIL_NOT_VERIFIED: "Verify your email address on your profile before applying.",
  ACCOUNT_NOT_ACTIVE: "Your account isn't active right now.",
};

function StatusCard({ standing, onReapply }: { standing: MyContributorStandingResponse; onReapply: () => void }) {
  const c = standing.contributor;
  if (standing.status === "APPLIED") {
    return (
      <Card>
        <CardContent className="p-6 flex gap-4">
          <Clock className="h-8 w-8 text-amber-500 shrink-0" />
          <div>
            <h2 className="font-semibold text-foreground mb-1">Your application is under review</h2>
            <p className="text-sm text-muted-foreground">
              Applied {c?.appliedAt ? new Date(c.appliedAt).toLocaleDateString() : ""}. We'll update this page
              once staff have looked at it — there's nothing more for you to do right now.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (standing.status === "ACTIVE") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">You're a contributor</h2>
              <p className="text-sm text-muted-foreground">Thanks for helping map the network.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-gradient-primary">
              <Link to="/contribute/propose">Propose a stop</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contribute/mine">My contributions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (standing.status === "SUSPENDED") {
    return (
      <Card>
        <CardContent className="p-6 flex gap-4">
          <XCircle className="h-8 w-8 text-destructive shrink-0" />
          <div>
            <h2 className="font-semibold text-foreground mb-1">Your contributor access is suspended</h2>
            {c?.decisionReason && <p className="text-sm text-muted-foreground">{c.decisionReason}</p>}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (standing.status === "DECLINED") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-4">
            <XCircle className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">Your application wasn't accepted</h2>
              {c?.decisionReason && <p className="text-sm text-muted-foreground">{c.decisionReason}</p>}
            </div>
          </div>
          <Button variant="outline" onClick={onReapply}>Apply again</Button>
        </CardContent>
      </Card>
    );
  }
  return null;
}

const ContributeApplyPage = () => {
  const { user, refreshUser } = useAuth();
  const [standing, setStanding] = useState<MyContributorStandingResponse | null>(null);
  const [agreement, setAgreement] = useState<ContributorAgreementResponse | null>(null);
  const [corridors, setCorridors] = useState<RouteGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      motivation: "",
      homeDistrict: "",
      corridorRouteGroupIds: [],
      affiliation: "NONE",
      affiliationDetail: "",
      agreementAccepted: false,
    },
  });

  const load = async () => {
    setLoading(true);
    try {
      const [standingRes, agreementRes, groupsRes] = await Promise.all([
        CommunityContributorsService.getMyContributorStanding(),
        CommunityContributorsService.getContributorAgreement(),
        RouteManagementService.getAllRouteGroupsAsList().catch(() => []),
      ]);
      setStanding(standingRes);
      setAgreement(agreementRes);
      setCorridors(groupsRes);
    } catch (err: any) {
      toast.error(err?.body?.message || err?.message || "Could not load the contributor programme right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Also refresh the account, in case the user just verified their email in another tab.
    refreshUser().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const affiliation = form.watch("affiliation");

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!agreement) return;
    setSubmitting(true);
    try {
      const payload: ContributorApplicationRequest = {
        motivation: values.motivation,
        homeDistrict: values.homeDistrict || undefined,
        corridorRouteGroupIds: values.corridorRouteGroupIds,
        affiliation: values.affiliation as ContributorApplicationRequest.affiliation,
        affiliationDetail: values.affiliation === "NONE" ? undefined : values.affiliationDetail,
        agreementVersion: agreement.version!,
      };
      const result = await CommunityContributorsService.applyToContribute(payload);
      toast.success("Application submitted");
      setStanding({ status: result.status, activeContributor: false, canApply: false, contributor: result });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.body?.message || err?.message || "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  const cannotApply = standing?.cannotApplyReason;
  const showStatusCard = standing && standing.status !== "NONE" && !showForm;
  const showFormNow = !showStatusCard && (standing?.canApply || showForm);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Apply to contribute</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : showStatusCard ? (
          <StatusCard standing={standing!} onReapply={() => setShowForm(true)} />
        ) : cannotApply && cannotApply in REASON_TEXT ? (
          <Card>
            <CardContent className="p-6 flex gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0" />
              <p className="text-sm text-muted-foreground">{REASON_TEXT[cannotApply]}</p>
            </CardContent>
          </Card>
        ) : showFormNow ? (
          <>
            {agreement?.draft && (
              <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  This agreement is a <strong>draft</strong>. Applications are still reviewed, but nobody is
                  accepted as a contributor until BusMate publishes the final agreement.
                </p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardContent className="p-5 space-y-5">
                    <FormField
                      control={form.control}
                      name="motivation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Why do you want to contribute?</FormLabel>
                          <FormControl>
                            <Textarea rows={4} placeholder="Which routes do you know well, and why?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="homeDistrict"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home district (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Colombo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {corridors.length > 0 && (
                      <FormField
                        control={form.control}
                        name="corridorRouteGroupIds"
                        render={() => (
                          <FormItem>
                            <FormLabel>Corridors you know (optional)</FormLabel>
                            <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
                              {corridors.map((group) => (
                                <FormField
                                  key={group.id}
                                  control={form.control}
                                  name="corridorRouteGroupIds"
                                  render={({ field }) => {
                                    const checked = field.value?.includes(group.id!);
                                    return (
                                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(v) => {
                                            const next = new Set(field.value);
                                            if (v) next.add(group.id!);
                                            else next.delete(group.id!);
                                            field.onChange(Array.from(next));
                                          }}
                                        />
                                        {group.name}
                                      </label>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="affiliation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you have any link to a bus operator?</FormLabel>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-2">
                              {AFFILIATION_OPTIONS.map((opt) => (
                                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                                  <RadioGroupItem value={opt.value} />
                                  {opt.label}
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {affiliation !== "NONE" && (
                      <FormField
                        control={form.control}
                        name="affiliationDetail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Which operator, and how are you linked to them?</FormLabel>
                            <FormControl>
                              <Textarea rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {agreement && (
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-semibold text-foreground">The contributor agreement</h3>
                      <div className="max-h-56 overflow-y-auto text-sm text-muted-foreground whitespace-pre-wrap border border-border rounded-md p-3 bg-muted/30">
                        {agreement.text}
                      </div>
                      <FormField
                        control={form.control}
                        name="agreementAccepted"
                        render={({ field }) => (
                          <FormItem>
                            <label className="flex items-start gap-2 text-sm cursor-pointer">
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                              <span>I have read and accept the contributor agreement above.</span>
                            </label>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                <Button type="submit" size="lg" className="bg-gradient-primary" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit application
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              You can't apply to contribute right now.
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ContributeApplyPage;
