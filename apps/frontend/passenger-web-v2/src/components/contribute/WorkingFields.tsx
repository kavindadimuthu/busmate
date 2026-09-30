import { Field } from "@/components/auth/Field";
import { RadioCard, SelectField, TextAreaField } from "@/components/form/controls";
import { SERVICE_CLASSES, WORKING_METHODS, type Problems, type WorkingForm } from "@/lib/propose.ts";

interface Props {
  form: WorkingForm;
  set: <K extends keyof WorkingForm>(key: K, value: WorkingForm[K]) => void;
  errors: Problems;
  today: string;
  /** Wording that differs between saying who runs a bus and correcting it. */
  copy: { operatorLabel: string; operatorPlaceholder: string; platesLabel: string; platesPlaceholder: string; classLabel: string; classPlaceholder: string };
}

/** The entries shared by "who runs this bus?" and its correction. Names and plates as seen: a contributor can't pick from
 * the registry, and a reviewer decides. It's a claim about a pattern, not about today's bus. */
export default function WorkingFields({ form, set, errors, today, copy }: Props) {
  return (
    <>
      <Field label={copy.operatorLabel} placeholder={copy.operatorPlaceholder} autoComplete="off" value={form.operator} onChange={(e) => set("operator", e.target.value)} error={errors.operator} />
      <TextAreaField label={copy.platesLabel} className="min-h-16" placeholder={copy.platesPlaceholder} hint="One plate means this bus; several mean the operator alternates among them." value={form.plates} onChange={(e) => set("plates", e.target.value)} error={errors.plates} />
      <SelectField label={copy.classLabel} placeholder={copy.classPlaceholder} options={SERVICE_CLASSES} value={form.serviceClass} onChange={(e) => set("serviceClass", e.target.value)} />
      <Field label="The day you saw it" type="date" max={today} value={form.observedOn} onChange={(e) => set("observedOn", e.target.value)} error={errors.observedOn} />
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-bold">How do you know?</legend>
        <div className="grid gap-2">
          {WORKING_METHODS.map((m) => (
            <RadioCard key={m.value} name="observationMethod" value={m.value} checked={form.observationMethod === m.value} onChange={() => set("observationMethod", m.value)}>
              {m.label}
            </RadioCard>
          ))}
        </div>
        {errors.observationMethod && <p className="mt-1.5 text-[13px] font-medium text-destructive">{errors.observationMethod}</p>}
      </fieldset>
      <TextAreaField label="Anything else a reviewer should know (optional)" className="min-h-20" value={form.note} onChange={(e) => set("note", e.target.value)} error={errors.note} hint={`${form.note.trim().length}/1000`} />
    </>
  );
}
