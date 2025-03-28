# Payment Gateway Integration Guide for TurfTime

This document provides instructions for integrating a real payment gateway with the TurfTime application.

## Prerequisites

1. Sign up for an account with a payment gateway of your choice. Some popular options in India include:
   - Razorpay
   - Paytm
   - CCAvenue
   - PayU
   - Instamojo

2. Obtain the necessary API keys and credentials from your payment gateway provider.

## Configuration Steps

1. Set up the following environment variables in your application:

```
PAYMENT_GATEWAY_KEY=your_payment_gateway_api_key
PAYMENT_GATEWAY_SECRET=your_payment_gateway_secret_key
PAYMENT_GATEWAY_MERCHANT_ID=your_merchant_id
PAYMENT_GATEWAY_WEBHOOK_SECRET=your_webhook_secret
```

2. Update the `server/payment-gateway.ts` file with your payment gateway's SDK or API client implementation.

## Integration Points

The application is already prepared for payment gateway integration at the following points:

### Server-side

1. **Payment Processing Endpoint**: `/api/payments/process` in `server/routes.ts`
   - Replace the commented code section with actual payment gateway API calls
   - Update the payment status and details based on the gateway response

2. **Webhook Endpoint**: You may need to create a new endpoint to receive payment status updates from the payment gateway
   - Create a route like `/api/payments/webhook` to handle callbacks from the payment gateway
   - Verify webhook signatures for security
   - Update booking status based on payment confirmation

### Client-side

1. **Payment Form**: Located in the booking process in `client/src/pages/customer/bookings.tsx`
   - Update the payment form fields based on the selected gateway's requirements
   - Include any client-side SDK initialization if required by the gateway

2. **Payment Confirmation**: Update the payment success/failure handling in the booking flow

## Testing

1. Most payment gateways provide a sandbox/test mode for development
2. Use test credentials to simulate payments without actual money transfer
3. Test various payment methods (UPI, card, netbanking) in sandbox mode
4. Test both successful and failed payment scenarios

## Going Live

1. Update environment variables with production API keys
2. Change the payment gateway configuration from test mode to production mode
3. Thoroughly test the live integration with small real transactions before full deployment

## Support

For any issues with payment gateway integration, refer to the documentation of your chosen payment provider or contact their support team.