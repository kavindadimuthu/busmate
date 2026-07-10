// Staff-only roles served by the portal, per the `user_types` seed data
// (admin, mot, timekeeper, operator, conductor, passenger). Conductor and
// passenger accounts belong to the mobile apps, not this portal.
const PORTAL_ROLES = ['admin', 'mot', 'timekeeper', 'operator'] as const;
export type PortalRole = (typeof PORTAL_ROLES)[number];

export function isPortalRole(userType: string | null | undefined): userType is PortalRole {
  return !!userType && (PORTAL_ROLES as readonly string[]).includes(userType.toLowerCase());
}

export function getRoleRedirectPath(role: string): string {
  switch (role?.toLowerCase()) {
    case 'mot':
      return '/mot/dashboard';
    case 'fleetoperator':
    case 'operator':
      return '/operator/dashboard';
    case 'timekeeper':
      return '/timekeeper/dashboard';
    case 'admin':
    case 'systemadmin':
    case 'system-admin':
      return '/admin/dashboard';
    default:
      return '/operator/dashboard';
  }
}
