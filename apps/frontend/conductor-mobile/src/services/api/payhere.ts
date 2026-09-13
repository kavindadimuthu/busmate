import { apiClient } from '../apiClient';

export interface PayHereHashResponse {
  merchantId: string;
  orderId: string;
  amount: number;
  currency: string;
  hash: string;
  sandbox: boolean;
}

export const payhereApi = {
  // Gets a server-computed hash for this order (INC-008). merchant_secret never leaves
  // ticketing-service - the hash is what proves to PayHere this request is genuinely ours,
  // and computing it in the app would mean shipping the secret inside the APK.
  getHash: async (orderId: string, amount: number): Promise<PayHereHashResponse> => {
    return apiClient.authenticatedRequest<PayHereHashResponse>(
      '/v1/payments/payhere/hash',
      {
        method: 'POST',
        body: JSON.stringify({ orderId, amount }),
      },
      'ticket',
    );
  },
};
