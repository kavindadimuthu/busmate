import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">404</h1>
        <p className="text-muted-foreground">This page doesn’t exist.</p>
        <Link to="/operator/dashboard" className="text-primary underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
