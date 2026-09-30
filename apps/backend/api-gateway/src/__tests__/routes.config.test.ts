import { routes } from '../config/routes.config';

/** Routes are mounted in order and the first match wins, so a public route only stays public if it comes before the
 * authenticated prefix that would otherwise catch it. */
describe('INC-072 the public booking-status route', () => {
  const indexOf = (prefix: string) => routes.findIndex((r) => r.pathPrefix === prefix);

  it('is public and reaches ticketing-service', () => {
    const route = routes[indexOf('/api/v1/tickets/booking-status')];
    expect(route).toBeDefined();
    expect(route.requiresAuth).toBe(false);
    expect(route.target).toBe('TICKETING');
  });

  it('comes before the authenticated ticket prefix that would otherwise catch it', () => {
    expect(indexOf('/api/v1/tickets/booking-status')).toBeGreaterThanOrEqual(0);
    expect(indexOf('/api/v1/tickets/booking-status')).toBeLessThan(indexOf('/api/v1/tickets'));
  });

  it('leaves every other ticket route authenticated', () => {
    const others = routes.filter((r) => r.pathPrefix.startsWith('/api/v1/tickets') && r.pathPrefix !== '/api/v1/tickets/booking-status');
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((r) => r.requiresAuth)).toBe(true);
  });
});
