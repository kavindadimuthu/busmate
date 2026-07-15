import type { OperatorResponse } from '@busmate/api-client-core';

/**
 * OperatorResponse plus userId, which core-service now always includes (see
 * apps/backend/core-service's OperatorResponse.java) but isn't declared on the generated
 * TypeScript type — regenerating @busmate/api-client-core requires a running core-service,
 * which the unified operator lifecycle work (Step 3) avoids depending on. The generated
 * client does plain JSON.parse, so userId is present on the real object at runtime; this
 * just widens the static type to match.
 */
export type OperatorResponseWithLink = OperatorResponse & { userId?: string | null };
