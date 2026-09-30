import { routes } from '../config/routes.config';

/** Routes are mounted in order and the first match wins, so a public route only stays public if it comes before the
 * authenticated prefix that would otherwise catch it. */
describe('INC-072/073 the public ticket routes', () => {
  const indexOf = (prefix: string) => routes.findIndex((r) => r.pathPrefix === prefix);

  const PUBLIC = ['/api/v1/tickets/booking-status', '/api/v1/tickets/quote'];

  it.each(PUBLIC)('%s is public and reaches ticketing-service', (prefix) => {
    const route = routes[indexOf(prefix)];
    expect(route).toBeDefined();
    expect(route.requiresAuth).toBe(false);
    expect(route.target).toBe('TICKETING');
  });

  it.each(PUBLIC)('%s comes before the authenticated ticket prefix that would otherwise catch it', (prefix) => {
    expect(indexOf(prefix)).toBeGreaterThanOrEqual(0);
    expect(indexOf(prefix)).toBeLessThan(indexOf('/api/v1/tickets'));
  });

  it('leaves every other ticket route authenticated', () => {
    const others = routes.filter((r) => r.pathPrefix.startsWith('/api/v1/tickets') && !PUBLIC.includes(r.pathPrefix));
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((r) => r.requiresAuth)).toBe(true);
  });
});
