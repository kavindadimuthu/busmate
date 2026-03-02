/**
 * Maps a user role to the corresponding dashboard path.
 */
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

/**
 * Checks whether a given role is permitted to access a specific route prefix.
 *
 * @param role - The user's role (from groups[0] in the access token)
 * @param routePrefix - The top-level route prefix, e.g. '/mot'
 */
export function isRoleAllowedForRoute(role: string, routePrefix: string): boolean {
  const roleMap: Record<string, string[]> = {
    '/mot': ['mot'],
    '/operator': ['fleetoperator', 'operator'],
    '/timekeeper': ['timekeeper'],
    '/admin': ['admin', 'systemadmin', 'system-admin'],
  };

  const allowedRoles = roleMap[routePrefix] ?? [];
  return allowedRoles.includes(role?.toLowerCase());
}
