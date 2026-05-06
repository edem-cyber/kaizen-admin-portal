export interface PaymentInitiationRequest {
  packageId: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  email: string;
  callbackUrl?: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  message: string;
  data: {
    authorizationUrl: string;
    reference: string;
    accessCode: string;
  };
}

export interface PaymentCallbackResponse {
  success: boolean;
  message: string;
  data: {
    reference: string;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    currency: string;
    paidAt: string;
  };
}

export interface SubscriptionOrderRequest {
  packageId: string;
  billingCycle: 'monthly' | 'yearly';
  userId?: string;
  organizationId?: string;
}