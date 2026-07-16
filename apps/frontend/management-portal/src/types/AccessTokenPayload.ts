// Shape of the JWT that user-service hands back as LoginResponse.accessToken — RS256, signed
// with user-service's own key and verified here via tokenVerifier.ts's JWKS fetch (legacy HS256
// tokens issued before the Phase 2b cutover verify against SUPABASE_JWT_SECRET instead). Mirrors
// api-gateway's own SupabaseJwtPayload (auth.middleware.ts / tokenVerifier.ts).
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
