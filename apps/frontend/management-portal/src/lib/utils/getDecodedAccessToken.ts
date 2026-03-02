'use server';

import { IdTokenPayload } from "@/types/IdTokenPayload";
import { asgardeo } from "@asgardeo/nextjs/server";

export async function getDecodedAccessToken(): Promise<IdTokenPayload | null> {
  const client = await asgardeo();
  try{
    const sessionId = await client.getSessionId();
    if (!sessionId) {
      return null;
    }
    const accessToken = await client.getAccessToken(sessionId as string);

    const decodedToken = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64').toString('utf-8')
    );
    
    return decodedToken as IdTokenPayload;
  } catch (error) {
    console.error("Error fetching or decoding token:", error);
    return null;
  }
}