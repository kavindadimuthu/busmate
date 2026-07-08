import { ApiError } from '@/lib/api-client/user-management';

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'error' in error.body) {
    return String((error.body as { error: unknown }).error) || fallback;
  }
  return fallback;
}
