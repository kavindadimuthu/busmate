// Shape of the Supabase-issued JWT that user-management hands back as
// LoginResponse.accessToken (HS256, signed with SUPABASE_JWT_SECRET) — mirrors
// api-gateway's own SupabaseJwtPayload (auth.middleware.ts).
export interface AccessTokenPayload {
  sub: string;
  email?: string;
  app_metadata?: {
    user_type?: string;
    account_status?: string;
  };
  exp: number;
  iat?: number;
}
