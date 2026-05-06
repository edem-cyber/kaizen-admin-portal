import { paymentRequest } from '@/lib/api-client';
import type { PaymentInitiationRequest, PaymentInitiationResponse, PaymentCallbackResponse, SubscriptionOrderRequest } from './payment.types';

class PaymentService {
  /**
   * Initiate payment for a subscription package
   * This will return a Paystack authorization URL for checkout
   */
  async initiateSubscriptionPayment(
    request: PaymentInitiationRequest
  ): Promise<PaymentInitiationResponse> {
    const response = await paymentRequest<PaymentInitiationResponse>({
      method: 'POST',
      url: '/api/v1/payments/initiate',
      data: request,
    });
    return response;
  }

  /**
   * Verify payment after Paystack callback
   */
  async verifyPayment(reference: string): Promise<PaymentCallbackResponse> {
    const response = await paymentRequest<PaymentCallbackResponse>({
      method: 'GET',
      url: `/api/v1/payments/verify/${reference}`,
    });
    return response;
  }

  /**
   * Create a subscription order and get payment link
   */
  async createSubscriptionOrder(
    request: SubscriptionOrderRequest
  ): Promise<PaymentInitiationResponse> {
    const response = await paymentRequest<PaymentInitiationResponse>({
      method: 'POST',
      url: '/api/v1/subscriptions/order',
      data: request,
    });
    return response;
  }

  /**
   * Open Paystack checkout in a new window and monitor for completion
   */
  openPaystackCheckout(authorizationUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Open the authorization URL in a new window
      const checkoutWindow = window.open(authorizationUrl, '_blank', 'width=500,height=600');
      
      if (!checkoutWindow) {
        // Popup was blocked
        resolve(false);
        return;
      }

      // Monitor for window closure
      const checkClosed = setInterval(() => {
        if (checkoutWindow.closed) {
          clearInterval(checkClosed);
          resolve(true);
        }
      }, 500);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!checkoutWindow.closed) {
          checkoutWindow.close();
        }
        resolve(false);
      }, 600000);
    });
  }
}

export const paymentService = new PaymentService();