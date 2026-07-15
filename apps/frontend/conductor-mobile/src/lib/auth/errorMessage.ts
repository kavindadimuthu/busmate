import { ApiError } from '@busmate/api-client-user';

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'error' in error.body) {
    return String((error.body as { error: unknown }).error) || fallback;
  }
  return fallback;
}
