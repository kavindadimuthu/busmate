// Sample authstete object for demonstartion
export const sampleAuthState = {
  user: {
    id: '12345',
    email: 'operator@example.com',
    user_role: 'operator',
    username: 'John Doe',
  },
  isAuthenticated: true,
  isLoading: false,
  login: async ({ email, password }: { email: string; password: string }) => {
    // Simulate login logic
    console.log(`Logging in with email: ${email} and password: ${password}`);
    return true;
  },
  logout: () => {
    // Simulate logout logic
    console.log('Logging out');
  },
  checkAuth: async () => {
    // Simulate auth check logic
    console.log('Checking authentication status');
    return true;
  },
};