import { Badge } from "@/components/ui/badge";
import type { SchemaObject, OpenApiSpec } from "@/types/openapi";
import { resolveRefName, resolveSchema } from "@/lib/openapi-parser";
import { cn } from "@/lib/utils";

interface SchemaViewerProps {
  schema: SchemaObject;
  spec: OpenApiSpec;
  depth?: number;
}

export function SchemaViewer({ schema, spec, depth = 0 }: SchemaViewerProps) {
  if (depth > 8) {
    return <span className="text-xs text-muted-foreground italic">... (max depth)</span>;
  }

  // Handle $ref
  if (schema.$ref) {
    const name = resolveRefName(schema.$ref);
    const resolved = spec.components?.schemas?.[name];
    if (!resolved) {
      return <Badge variant="outline" className="text-[10px] font-mono">{name}</Badge>;
    }
    return (
      <div className="space-y-1">
        <Badge variant="outline" className="text-[10px] font-mono">{name}</Badge>
        <SchemaViewer schema={resolved} spec={spec} depth={depth + 1} />
      </div>
    );
  }

  // Handle array
  if (schema.type === "array" && schema.items) {
    const items = resolveSchema(schema.items, spec) || schema.items;
    return (
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Array of:</span>
        <div className="pl-3 border-l border-border">
          <SchemaViewer schema={items} spec={spec} depth={depth + 1} />
        </div>
      </div>
    );
  }

  // Handle object with properties
  if (schema.type === "object" || schema.properties) {
    const properties = schema.properties || {};
    const required = new Set(schema.required || []);

    return (
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-2 py-1 font-medium">Field</th>
              <th className="text-left px-2 py-1 font-medium">Type</th>
              <th className="text-left px-2 py-1 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(properties).map(([name, prop]) => {
              const resolvedProp = resolveSchema(prop, spec) || prop;
              const isRequired = required.has(name);
              const typeStr = getTypeString(prop, spec);

              return (
                <tr key={name} className="border-t border-border">
                  <td className="px-2 py-1.5 font-mono align-top">
                    {name}
                    {isRequired && <span className="text-destructive ml-0.5">*</span>}
                  </td>
                  <td className="px-2 py-1.5 align-top">
                    <span
                      className={cn(
                        "text-[10px] font-mono px-1 py-0.5 rounded",
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {typeStr}
                    </span>
                    {resolvedProp.enum && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {resolvedProp.enum.map((v: string) => (
                          <Badge key={v} variant="secondary" className="text-[9px] px-1 py-0">
                            {String(v)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground align-top">
                    {resolvedProp.description || "—"}
                    {resolvedProp.example !== undefined && (
                      <span className="block mt-0.5 font-mono text-[10px]">
                        Example: {JSON.stringify(resolvedProp.example)}
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

  // Primitive type
  return (
    <span className="text-xs font-mono text-muted-foreground">
      {schema.type || "any"}
      {schema.format ? ` (${schema.format})` : ""}
      {schema.description ? ` — ${schema.description}` : ""}
    </span>
  );
}

function getTypeString(schema: SchemaObject, spec: OpenApiSpec): string {
  if (schema.$ref) return resolveRefName(schema.$ref);
  if (schema.type === "array" && schema.items) {
    return `${getTypeString(schema.items, spec)}[]`;
  }
  return schema.type || "object";
}
