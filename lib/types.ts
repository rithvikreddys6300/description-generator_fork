// Credit system types
export interface CreditBalance {
  userId: string;
  credits: number;
  lastUpdated: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // positive for purchases, negative for usage
  type: 'purchase' | 'usage' | 'refund';
  description: string;
  stripePaymentIntentId?: string;
  timestamp: Date;
}

export interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  popular?: boolean;
  description?: string;
}

// Stripe-related types
export interface CreateCheckoutSessionRequest {
  planId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// Credit usage types
export interface CreditUsage {
  generateDescription: number;
  baseCreditsPerDescription: 1;
  modelMultipliers: {
    'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo': 1;
    'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo': 2;
  };
  languageMultiplier: number; // per additional language
}
