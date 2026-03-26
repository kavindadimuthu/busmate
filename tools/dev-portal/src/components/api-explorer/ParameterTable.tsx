import { Badge } from "@/components/ui/badge";
import type { ParameterObject, OpenApiSpec, SchemaObject } from "@/types/openapi";
import { resolveRefName, resolveSchema } from "@/lib/openapi-parser";

interface ParameterTableProps {
  parameters: ParameterObject[];
  spec: OpenApiSpec;
}

export function ParameterTable({ parameters, spec }: ParameterTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-2 py-1 font-medium">Name</th>
            <th className="text-left px-2 py-1 font-medium">Type</th>
            <th className="text-left px-2 py-1 font-medium">Required</th>
            <th className="text-left px-2 py-1 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param) => {
            const schema = resolveSchema(param.schema, spec) || param.schema;
            const typeStr = schema ? getTypeDisplay(schema, spec) : "string";

            return (
              <tr key={`${param.in}-${param.name}`} className="border-t border-border">
                <td className="px-2 py-1.5 font-mono">{param.name}</td>
                <td className="px-2 py-1.5">
                  <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground">
                    {typeStr}
                  </span>
                  {schema?.enum && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {schema.enum.map((v: string) => (
                        <Badge key={v} variant="secondary" className="text-[9px] px-1 py-0">
                          {String(v)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  {param.required ? (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0">Yes</Badge>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {param.description || "—"}
                  {schema?.example !== undefined && (
                    <span className="block mt-0.5 font-mono text-[10px]">
                      Example: {JSON.stringify(schema.example)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getTypeDisplay(schema: SchemaObject, spec: OpenApiSpec): string {
  if (schema.$ref) return resolveRefName(schema.$ref);
  if (schema.type === "array" && schema.items) {
    return `${getTypeDisplay(schema.items, spec)}[]`;
  }
  let str = schema.type || "object";
  if (schema.format) str += ` (${schema.format})`;
  return str;
}
