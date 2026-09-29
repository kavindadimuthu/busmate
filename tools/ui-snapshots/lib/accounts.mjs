// The dev seed's accounts (docs/dev-seed-credentials.md), created automatically by user-service's Flyway dev
// seed on any fresh SPRING_PROFILES_ACTIVE=dev database. One account per role this tool needs to sign in as.
export const ACCOUNTS = {
  admin: { email: 'admin@busmate.test', password: 'Admin@2026' },
  mot: { email: 'mot@busmate.test', password: 'Mot@2026' },
  timekeeper: { email: 'timekeeper@busmate.test', password: 'Timekeeper@2026' },
  operator: { email: 'operator.suwaseriya@busmate.test', password: 'Operator1@2026' },
  passenger: { email: 'passenger.dilani@busmate.test', password: 'Passenger1@2026' },
};
