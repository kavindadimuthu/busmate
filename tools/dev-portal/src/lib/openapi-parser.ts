import type {
  OpenApiSpec,
  ParsedEndpoint,
  ParsedTag,
  HttpMethod,
  HTTP_METHODS,
  SchemaObject,
} from "@/types/openapi";

const METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete"];

/**
 * Parse an OpenAPI 3.x spec into UI-friendly structures grouped by tag.
 */
export function parseOpenApiSpec(spec: OpenApiSpec): ParsedTag[] {
  const tagMap = new Map<string, ParsedEndpoint[]>();
  const tagDescriptions = new Map<string, string>();

  // Index tag descriptions
  if (spec.tags) {
    for (const tag of spec.tags) {
      tagDescriptions.set(tag.name, tag.description || "");
    }
  }

  // Parse all paths and operations
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const endpoint: ParsedEndpoint = {
        id: `${method}-${path}`,
        method,
        path,
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags || ["Untagged"],
        parameters: [
          ...(pathItem.parameters || []),
          ...(operation.parameters || []),
        ],
        requestBody: operation.requestBody,
        responses: operation.responses || {},
        deprecated: operation.deprecated,
        security: operation.security,
      };

      for (const tag of endpoint.tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, []);
        tagMap.get(tag)!.push(endpoint);
      }
    }
  }

  // Build sorted tag list
  const tags: ParsedTag[] = [];
  for (const [name, endpoints] of tagMap.entries()) {
    tags.push({
      name,
      description: tagDescriptions.get(name),
      endpoints: endpoints.sort((a, b) => {
        // Sort: POST first, then GET, PUT, PATCH, DELETE. Within same method, by path.
        const order = { post: 0, get: 1, put: 2, patch: 3, delete: 4 };
        const diff = order[a.method] - order[b.method];
        return diff !== 0 ? diff : a.path.localeCompare(b.path);
      }),
    });
  }

  // Sort tags alphabetically (matches Swagger UI alphabetical sorting config)
  tags.sort((a, b) => a.name.localeCompare(b.name));

  return tags;
}

/**
 * Resolve a $ref string to the schema name.
 * e.g., "#/components/schemas/StopDTO" → "StopDTO"
 */
export function resolveRefName(ref: string): string {
  const parts = ref.split("/");
  return parts[parts.length - 1];
}

/**
 * Resolve a $ref to the actual schema from the spec's components.
 */
export function resolveSchema(
  schema: SchemaObject | undefined,
  spec: OpenApiSpec
): SchemaObject | undefined {
  if (!schema) return undefined;
  if (schema.$ref) {
    const name = resolveRefName(schema.$ref);
    return spec.components?.schemas?.[name];
  }
  return schema;
}

/**
 * Get all schema names from the spec.
 */
export function getSchemaNames(spec: OpenApiSpec): string[] {
  if (!spec.components?.schemas) return [];
  return Object.keys(spec.components.schemas).sort();
}

/**
 * Count total endpoints in a spec.
 */
export function countEndpoints(spec: OpenApiSpec): number {
  let count = 0;
  for (const pathItem of Object.values(spec.paths || {})) {
    for (const method of METHODS) {
      if (pathItem[method]) count++;
    }
  }
  return count;
}

/**
 * Get the method badge CSS class.
 */
export function getMethodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    get: "method-get",
    post: "method-post",
    put: "method-put",
    patch: "method-patch",
    delete: "method-delete",
  };
  return colors[method];
}
