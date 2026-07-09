'use client';

// Client-side data layer for the admin "User Management" section. All calls go through
// api-gateway (UserManagementAPI.BASE, wired in ./setup.ts) — never straight to
// user-management — same as every other browser-facing caller in this app.
import {
  ApiError,
  UsersControllerService,
  OpenAPI as UserManagementAPI,
} from '@busmate/api-client-user';
import type {
  CreateUserRequest,
  PageUserResponse,
  RegisterResponse,
  UpdateUserRequest,
  UserPermissionsResponse,
  UserResponse,
} from '@busmate/api-client-user';
import { fetchAccessToken } from './setup';

export type {
  CreateUserRequest,
  PageUserResponse,
  RegisterResponse,
  UpdateUserRequest,
  UserPermissionsResponse,
  UserResponse,
};

/**
 * UserResponse plus operatorSyncStatus, which the backend now always includes for
 * userType="operator" but isn't declared on the generated UserResponse type (that would
 * require regenerating @busmate/api-client-user against a running user-service, which we're
 * avoiding here — see docs/plans/Unified-Operator-Lifecycle-Management-Plan.md Step 3).
 * The generated client's request functions do plain JSON.parse, so the field is present on
 * the real object at runtime; this just widens the static type to match.
 */
export type UserResponseWithSync = UserResponse & { operatorSyncStatus?: string | null };

// The six real user_types seeded in user-management (see data.sql) — admin manages all
// of them. "driver" does not exist as a distinct user_type in the real backend.
export const MANAGED_USER_TYPES = ['admin', 'mot', 'timekeeper', 'operator', 'conductor', 'passenger'] as const;
export type ManagedUserType = (typeof MANAGED_USER_TYPES)[number];

// The only account_status values the backend ever actually sets (register → pending,
// admin-create → active, delete → inactive). "suspended" is checked by the gateway's JWT
// filter but nothing in user-management ever sets it, so it's not offered here.
export const ACCOUNT_STATUSES = ['active', 'inactive', 'pending'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

// Per-type required profileData fields, mirrored exactly from
// ProfileSchemaValidator.REQUIRED_FIELDS on the backend — keep these two in sync.
// operator_type/region are required (in addition to organization_name/registration_id)
// because core-service's Operator entity needs them for the unified operator lifecycle
// sync — see docs/plans/Unified-Operator-Lifecycle-Management-Plan.md.
export const REQUIRED_PROFILE_FIELDS: Partial<Record<ManagedUserType, string[]>> = {
  mot: ['employee_id'],
  timekeeper: ['assign_stand', 'nic'],
  operator: ['organization_name', 'registration_id', 'operator_type', 'region'],
  conductor: ['employee_id', 'assign_operator_id', 'nic_number'],
};

export class AdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

function toAdminApiError(error: unknown): AdminApiError {
  if (error instanceof ApiError) {
    const bodyMessage = error.body && typeof error.body === 'object' ? error.body.error : undefined;
    return new AdminApiError(error.status, typeof bodyMessage === 'string' ? bodyMessage : error.message);
  }
  if (error instanceof AdminApiError) {
    return error;
  }
  return new AdminApiError(0, 'Unable to reach the server. Please check your connection.');
}

async function unwrap<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export interface ListUsersParams {
  userType: ManagedUserType;
  status?: AccountStatus;
  search?: string;
  /** 0-indexed, matches Spring's Pageable. */
  page?: number;
  size?: number;
  /** e.g. "fullName,asc" */
  sort?: string;
}

/**
 * Hand-rolled rather than UsersControllerService.listUsers() — the generated client
 * serializes its `pageable` parameter as nested `pageable[page]=`/`pageable[size]=` query
 * keys (openapi-typescript-codegen's generic object-flattening in core/request.ts), which
 * Spring's Pageable resolver doesn't recognize; it silently falls back to page 0 / size 20
 * every time. This builds the flat `page`/`size`/`sort` query string Spring actually binds.
 */
export async function listUsers(
  params: ListUsersParams,
): Promise<Omit<PageUserResponse, 'content'> & { content?: UserResponseWithSync[] }> {
  const query = new URLSearchParams();
  query.set('user_type', params.userType);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.sort) query.set('sort', params.sort);

  let token: string;
  try {
    token = await fetchAccessToken();
  } catch {
    throw new AdminApiError(401, 'Your session has expired. Please sign in again.');
  }

  const res = await fetch(`${UserManagementAPI.BASE}/api/users?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = typeof body?.error === 'string' ? body.error : `Request failed (${res.status})`;
    throw new AdminApiError(res.status, message);
  }

  return res.json();
}

export function getUser(userId: string): Promise<UserResponseWithSync> {
  return unwrap(UsersControllerService.getUser(userId)) as Promise<UserResponseWithSync>;
}

export function createUser(payload: CreateUserRequest): Promise<RegisterResponse> {
  return unwrap(UsersControllerService.createUser(payload));
}

export function updateUser(userId: string, payload: UpdateUserRequest): Promise<UserResponse> {
  return unwrap(UsersControllerService.updateUser(userId, payload));
}

/** Deactivates the account (bans in Supabase Auth + sets accountStatus to "inactive"). Not a hard delete. */
export function deactivateUser(userId: string): Promise<void> {
  return unwrap(UsersControllerService.deleteUser(userId));
}

/** Reverses deactivateUser() — unbans in Supabase Auth + sets accountStatus back to "active". */
export function reactivateUser(userId: string): Promise<UserResponse> {
  return unwrap(UsersControllerService.reactivateUser(userId));
}

export function getUserProfile(userId: string): Promise<Record<string, unknown>> {
  return unwrap(UsersControllerService.getProfile(userId));
}

export function updateUserProfile(userId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  return unwrap(UsersControllerService.updateProfile(userId, patch));
}

export function getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  return unwrap(UsersControllerService.getPermissions(userId));
}

/**
 * Manual "retry sync" action for an operator whose core-service sync landed in FAILED.
 * Hand-rolled (raw fetch, same pattern as listUsers()) because this endpoint doesn't exist
 * in the generated client — see the UserResponseWithSync comment above for why.
 */
export async function retryOperatorSync(userId: string): Promise<void> {
  let token: string;
  try {
    token = await fetchAccessToken();
  } catch {
    throw new AdminApiError(401, 'Your session has expired. Please sign in again.');
  }

  const res = await fetch(`${UserManagementAPI.BASE}/api/users/${userId}/operator-sync/retry`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = typeof body?.error === 'string' ? body.error : `Request failed (${res.status})`;
    throw new AdminApiError(res.status, message);
  }
}
