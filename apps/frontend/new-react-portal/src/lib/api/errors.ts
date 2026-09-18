import { ApiError as CoreApiError } from '@busmate/api-client-core';
import { ApiError as TicketingApiError } from '@busmate/api-client-ticketing';
import { ApiError as UserApiError } from '@busmate/api-client-user';

/**
 * The message a user should see for a failed API call. core-service and ticketing answer with
 * { message }, user-service with { error }; field validation adds { errors: { field: msg } }.
 */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof CoreApiError || error instanceof TicketingApiError || error instanceof UserApiError) {
    const body = error.body as { message?: unknown; error?: unknown; errors?: Record<string, string> } | undefined;
    if (body?.errors && typeof body.errors === 'object' && Object.keys(body.errors).length > 0) {
      return Object.values(body.errors).join(' · ');
    }
    if (typeof body?.message === 'string' && body.message) return body.message;
    if (typeof body?.error === 'string' && body.error) return body.error;
    if (error.status === 403) return 'You do not have permission to do that.';
    if (error.status === 404) return 'Not found.';
    return `${fallback} (${error.status})`;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
