import type { Row } from "@/lib/contributions.ts";

/** What a proposal says, one fact to a row; a changed fact shows the old value struck through, then the new one. */
export default function ProposalRows({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid gap-3 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="grid gap-0.5">
          <dt className="text-xs text-muted-foreground">{r.label}</dt>
          <dd className="min-w-0 break-words font-semibold">
            {r.before !== null && r.changed ? (
              <>
                <span className="font-normal text-muted-foreground line-through">{r.before}</span>
                <span aria-hidden className="mx-1.5 text-primary">→</span>
                <span className="sr-only"> changed to </span>
                {r.after}
              </>
            ) : (
              r.after
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
