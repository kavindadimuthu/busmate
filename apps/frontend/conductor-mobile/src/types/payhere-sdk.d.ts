// @payhere/payhere-mobilesdk-reactnative ships no type declarations (INC-008).
// Typed against the fields this app actually sends/reads - see
// support.payhere.lk/api-&-mobile-sdk/checkout-api for the full paymentObject shape.
declare module '@payhere/payhere-mobilesdk-reactnative' {
  export interface PayHerePaymentObject {
    sandbox: boolean;
    merchant_id: string;
    notify_url: string;
    order_id: string;
    items: string;
    amount: string;
    currency: string;
    hash: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  }

  const PayHere: {
    startPayment(
      paymentObject: PayHerePaymentObject,
      onCompleted: (paymentId: string) => void,
      onError: (error: string) => void,
      onDismissed: () => void,
    ): void;
  };

  export default PayHere;
}
