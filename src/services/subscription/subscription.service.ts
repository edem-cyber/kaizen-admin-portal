import { billingRequest } from '@/lib/api-client';
import type { AxiosRequestConfig } from 'axios';
import type { UserDto } from '@/lib/generated/user/models/userDto';
import { isPlatformAdmin } from '@/lib/authorization';
import {
  ServicePackage,
  OrganizationSubscription,
  SubscriptionCheckResult,
  SubscriptionStatus,
  EXEMPT_ROUTES,
  Invoice,
  CheckoutResponse,
} from './types';

/**
 * Subscription Service
 * Handles all subscription-related API calls and business logic
 */
export const SubscriptionService = {
  /**
   * Whether this user's organization requires an active subscription to
   * use the app. Platform admins are always exempt; corporate orgs always
   * require one.
   */
  requiresSubscription(user: UserDto | null | undefined): boolean {
    return !isPlatformAdmin(user);
  },

  /**
   * Get all applicable packages for the current user's organization
   */
  async getApplicablePackages(params?: {
    type?: 'STANDARD' | 'CUSTOM';
    discountId?: number;
    currencyId?: number;
    recurring?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: ServicePackage[]; message?: string }> {
    try {
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: '/api/v1/packages/applicable',
        params,
      };
      const response = await billingRequest<{ data?: { data?: ServicePackage[] } }>(config);
      return {
        success: true,
        data: response?.data?.data || [],
      };
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch packages',
      };
    }
  },

  /**
   * Get all packages (admin view)
   */
  async getPackages(params?: {
    type?: 'STANDARD' | 'CUSTOM';
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: ServicePackage[]; message?: string }> {
    try {
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: '/api/v1/packages',
        params,
      };
      const response = await billingRequest<{ data?: { data?: ServicePackage[] } }>(config);
      return {
        success: true,
        data: response?.data?.data || [],
      };
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch packages',
      };
    }
  },

  /**
   * Get organization's subscriptions
   */
  async getOrganizationSubscriptions(params: {
    organizationId: string | number;
    packageId?: number;
    status?: 'ACTIVE' | 'ALL';
    page?: number;
    limit?: number;
    orderBy?: string;
  }): Promise<{ success: boolean; data: OrganizationSubscription[]; message?: string }> {
    try {
      const { organizationId, ...queryParams } = params;
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: `/api/v1/organizations/${organizationId}/subscriptions`,
        params: queryParams,
      };
      // billingRequest returns response.data directly, so response is { data: [...], pagination: {...} }
      const response = await billingRequest<{ data?: OrganizationSubscription[]; pagination?: unknown }>(config);
      return {
        success: true,
        data: response?.data || [],
      };
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch subscriptions',
      };
    }
  },

  /**
   * Create a new subscription (returns Paystack checkout URL)
   */
  async createSubscription(params: {
    organizationId: string | number;
    packageId: string | number;
    quantity?: number;
  }): Promise<CheckoutResponse> {
    try {
      const { organizationId, packageId, quantity = 1 } = params;
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: `/api/v1/organizations/${organizationId}/subscriptions`,
        data: { packageId: packageId.toString(), quantity },
      };
      const response = await billingRequest<Record<string, unknown>>(config);

      // Extract checkout URL from various possible response shapes
      const checkoutUrl = this.extractCheckoutUrl(response);

      return {
        success: true,
        message: 'Subscription created successfully',
        checkoutUrl,
        data: response,
      };
    } catch (error) {
      console.error('Failed to create subscription:', error);
      return {
        success: false,
        message: 'Failed to create subscription',
      };
    }
  },

  /**
   * Change/upgrade subscription
   */
  async changeSubscription(params: {
    organizationId: string | number;
    subscriptionId: string | number;
    packageId: string | number;
    quantity?: number;
  }): Promise<CheckoutResponse> {
    try {
      const { organizationId, subscriptionId, packageId, quantity = 1 } = params;
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: `/api/v1/organizations/${organizationId}/subscriptions/${subscriptionId}/change`,
        data: { packageId: packageId.toString(), quantity },
      };
      const response = await billingRequest<Record<string, unknown>>(config);

      const checkoutUrl = this.extractCheckoutUrl(response);

      return {
        success: true,
        message: 'Subscription changed successfully',
        checkoutUrl,
        data: response,
      };
    } catch (error) {
      console.error('Failed to change subscription:', error);
      return {
        success: false,
        message: 'Failed to change subscription',
      };
    }
  },

  /**
   * Smart subscription handler - checks if user has active subscription
   * If active subscription exists: calls changeSubscription
   * If no active subscription: calls createSubscription
   */
  async subscribeOrChange(params: {
    organizationId: string | number;
    packageId: string | number;
    quantity?: number;
  }): Promise<CheckoutResponse & { isNewSubscription: boolean }> {
    try {
      const { organizationId, packageId, quantity = 1 } = params;

      // First, check if user has an active subscription
      const subscriptionsResponse = await this.getOrganizationSubscriptions({
        organizationId,
        status: 'ACTIVE',
        limit: 10,
      });

      const activeSubscription = subscriptionsResponse.success 
        ? this.findActiveSubscription(subscriptionsResponse.data)
        : null;

      if (activeSubscription) {
        // User has active subscription - use change API
        console.log('User has active subscription, calling changeSubscription API');
        const result = await this.changeSubscription({
          organizationId,
          subscriptionId: activeSubscription.id,
          packageId,
          quantity,
        });
        return {
          ...result,
          isNewSubscription: false,
        };
      } else {
        // No active subscription - create new
        console.log('No active subscription found, calling createSubscription API');
        const result = await this.createSubscription({
          organizationId,
          packageId,
          quantity,
        });
        return {
          ...result,
          isNewSubscription: true,
        };
      }
    } catch (error) {
      console.error('Failed in subscribeOrChange:', error);
      return {
        success: false,
        message: 'Failed to process subscription',
        isNewSubscription: false,
      };
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(params: {
    organizationId: string | number;
    subscriptionId: string | number;
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { organizationId, subscriptionId, reason } = params;
      const config: AxiosRequestConfig = {
        method: 'PUT',
        url: `/api/v1/organizations/${organizationId}/subscriptions/${subscriptionId}/cancel`,
        data: { reason },
      };
      await billingRequest(config);
      return {
        success: true,
        message: 'Subscription cancelled successfully',
      };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return {
        success: false,
        message: 'Failed to cancel subscription',
      };
    }
  },

  /**
   * Get invoices for organization
   */
  async getInvoices(params: {
    organizationId: string | number;
    limit?: number;
  }): Promise<{ success: boolean; data: Invoice[]; message?: string }> {
    try {
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: '/api/v1/invoices',
        params,
      };
      const response = await billingRequest<{ data?: { data?: Invoice[] } }>(config);
      return {
        success: true,
        data: response?.data?.data || [],
      };
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch invoices',
      };
    }
  },

  /**
   * Find active subscription from list
   */
  findActiveSubscription(subscriptions: OrganizationSubscription[]): OrganizationSubscription | null {
    const now = new Date();
    const inactiveStatuses: SubscriptionStatus[] = ['CANCELLED', 'EXPIRED', 'FAILED', 'INACTIVE'];

    for (const sub of subscriptions) {
      const normalizedStatus = sub.status.toUpperCase() as SubscriptionStatus;

      // Skip inactive statuses
      if (inactiveStatuses.includes(normalizedStatus)) {
        continue;
      }

      // Check expiry
      if (sub.nextRenewalDate) {
        const renewalDate = new Date(sub.nextRenewalDate);
        if (renewalDate <= now) {
          continue;
        }
      }

      // Must be recurring package
      if (sub.servicePackage && !sub.servicePackage.recurring) {
        continue;
      }

      // Must be ACTIVE status
      if (normalizedStatus !== 'ACTIVE') {
        continue;
      }

      return sub;
    }

    return null;
  },

  /**
   * Complete subscription check for a user.
   *
   * Accepts either a `user` (preferred — short-circuits for platform
   * admins via `requiresSubscription`) or just an `organizationId` for
   * post-payment flows where the subscription must be re-fetched
   * regardless of role.
   */
  async checkSubscriptionStatus(params: {
    organizationId: string | number;
    user?: UserDto | null;
  }): Promise<SubscriptionCheckResult> {
    try {
      const { organizationId, user } = params;

      // If a user is supplied, short-circuit for exempt accounts.
      const requiresSubscription = user ? this.requiresSubscription(user) : true;

      if (!requiresSubscription) {
        return {
          requiresSubscription: false,
          hasActiveSubscription: true, // Not required, so has access
          activeSubscription: null,
          subscriptions: [],
        };
      }

      // Fetch subscriptions
      const response = await this.getOrganizationSubscriptions({
        organizationId,
        status: 'ACTIVE',
        limit: 50,
        orderBy: 'subscriptionDate:desc',
      });

      if (!response.success) {
        return {
          requiresSubscription: true,
          hasActiveSubscription: false,
          activeSubscription: null,
          subscriptions: [],
          error: response.message,
        };
      }

      const activeSubscription = this.findActiveSubscription(response.data);

      return {
        requiresSubscription: true,
        hasActiveSubscription: activeSubscription !== null,
        activeSubscription,
        subscriptions: response.data,
      };
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return {
        requiresSubscription: false, // Default to allow access on error
        hasActiveSubscription: false,
        activeSubscription: null,
        subscriptions: [],
        error: 'Failed to check subscription status',
      };
    }
  },

  /**
   * Check if route should be blocked by subscription wall
   */
  shouldBlockRoute(params: {
    currentRoute?: string;
    requiresSubscription: boolean;
    hasActiveSubscription: boolean;
  }): boolean {
    const { currentRoute, requiresSubscription, hasActiveSubscription } = params;

    // Allow access if route is exempt
    if (currentRoute && EXEMPT_ROUTES.includes(currentRoute as typeof EXEMPT_ROUTES[number])) {
      return false;
    }

    // Allow access if subscription not required
    if (!requiresSubscription) {
      return false;
    }

    // Block access if subscription required but not active
    return !hasActiveSubscription;
  },

  /**
   * Extract checkout URL from various API response shapes
   */
  extractCheckoutUrl(responseData: unknown): string | undefined {
    if (!responseData || typeof responseData !== 'object') return undefined;
    
    const data = responseData as Record<string, unknown>;
    const nestedData = (data?.data as Record<string, unknown>) || undefined;
    const deepNested = (nestedData?.data as Record<string, unknown>) || undefined;
    
    const possibleUrls: (unknown)[] = [
      deepNested?.checkoutUrl,
      nestedData?.checkoutUrl,
      deepNested?.paymentUrl,
      nestedData?.paymentUrl,
      deepNested?.url,
      nestedData?.url,
      data.checkoutUrl,
      data.paymentUrl,
      data.url,
    ];

    for (const url of possibleUrls) {
      if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
        return url;
      }
    }

    return undefined;
  },
};

export default SubscriptionService;