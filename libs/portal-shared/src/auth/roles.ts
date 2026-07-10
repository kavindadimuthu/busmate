// Role model shared by government-portal and operator-portal. Mirrors the
// gateway BFF's roles.ts so client-side gating agrees with server-side gating.

export type PortalRole = 'admin' | 'mot' | 'timekeeper' | 'operator';

const GOVERNMENT_ROLES: PortalRole[] = ['admin', 'mot', 'timekeeper'];
const OPERATOR_ROLES: PortalRole[] = ['operator'];

export function normalizeRole(userType: string | null | undefined): string {
  return (userType ?? '').toLowerCase();
}

export function getRoleRedirectPath(userType: string | null | undefined): string {
  switch (normalizeRole(userType)) {
    case 'admin':
      return '/admin/dashboard';
    case 'mot':
      return '/mot/dashboard';
    case 'timekeeper':
      return '/timekeeper/dashboard';
    case 'operator':
      return '/operator/dashboard';
    default:
      return '/';
  }
}

// Which portal a given role belongs to. Used so each app can reject a valid
// staff account that simply belongs to the *other* portal (e.g. an operator
// landing on government-portal) with a clear message instead of a blank gate.
export function rolesForPortal(portal: 'government' | 'operator'): PortalRole[] {
  return portal === 'government' ? GOVERNMENT_ROLES : OPERATOR_ROLES;
}

export function isRoleAllowedForPortal(userType: string | null | undefined, portal: 'government' | 'operator'): boolean {
  return rolesForPortal(portal).includes(normalizeRole(userType) as PortalRole);
}
