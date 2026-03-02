export interface IdTokenPayload {
  sub: string;
  aut: string;
  iss: string;
  groups: string[];
  given_name: string;
  client_id: string;
  aud: string;
  nbf: number;
  azp: string;
  org_id: string;
  scope: string;
  exp: number;
  org_name: string;
  iat: number;
  family_name: string;
  jti: string;
  email?: string;
}