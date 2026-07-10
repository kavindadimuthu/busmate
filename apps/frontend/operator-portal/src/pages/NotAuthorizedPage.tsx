import { Button } from '@busmate/ui';
import { useAuth } from '@busmate/portal-shared';
import { useNavigate } from 'react-router-dom';

// Shown when a valid staff account that is NOT an operator (e.g. an admin/mot
// account) reaches this portal. Government users belong to government-portal.
export default function NotAuthorizedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="text-muted-foreground">
          This is the operator portal. Your account ({user?.userType}) belongs to the government portal.
        </p>
        <Button
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
        >
          Sign in with a different account
        </Button>
      </div>
    </div>
  );
}
