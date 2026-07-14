'use client';

// Client-side data layer for "change my password" — the one self-service action that
// isn't a plain Users CRUD call (it lives on AuthControllerService, not UsersControllerService).
// Same gateway/token wiring as ./adminUsers; reuses its error type for a consistent shape.
import { ApiError, AuthControllerService } from '@busmate/api-client-user';
import type { ChangePasswordRequest } from '@busmate/api-client-user';
import { AdminApiError } from './adminUsers';

export type { ChangePasswordRequest };

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  try {
    await AuthControllerService.changePassword(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      const bodyMessage = error.body && typeof error.body === 'object' ? (error.body as Record<string, unknown>).error : undefined;
      throw new AdminApiError(error.status, typeof bodyMessage === 'string' ? bodyMessage : error.message);
    }
    throw new AdminApiError(0, 'Unable to reach the server. Please check your connection.');
  }
}
