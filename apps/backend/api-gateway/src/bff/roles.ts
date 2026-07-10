// Staff-only roles served by the government/operator portals, mirroring
// management-portal's original `session.ts` PORTAL_ROLES list. Conductor and
// passenger accounts belong to the mobile apps, not these portals.
const PORTAL_ROLES = ['admin', 'mot', 'timekeeper', 'operator'] as const;
export type PortalRole = (typeof PORTAL_ROLES)[number];

export function isPortalRole(userType: string | null | undefined): userType is PortalRole {
  return !!userType && (PORTAL_ROLES as readonly string[]).includes(userType.toLowerCase());
}

// Which portal + landing route each role belongs to. Ported from
// management-portal's getRoleRedirectPath so the client can route users to the
// right home after login. Government portal owns admin/mot/timekeeper; the
// operator portal owns operator.
export function getRoleRedirectPath(userType: string | null | undefined): string {
  switch ((userType ?? '').toLowerCase()) {
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
