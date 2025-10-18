import { PricingPlan, CreditBalance, CreditTransaction, CreditUsage } from './types';

// Pricing plans configuration
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 999, // $9.99
    description: 'Perfect for trying out the service',
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 200,
    price: 2999, // $29.99
    popular: true,
    description: 'Great for small businesses',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 1000,
    price: 9999, // $99.99
    description: 'For large-scale operations',
  },
];

// Credit usage configuration
export const CREDIT_USAGE: CreditUsage = {
  generateDescription: 1,
  baseCreditsPerDescription: 1,
  modelMultipliers: {
    'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo': 1,
    'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo': 2,
  },
  languageMultiplier: 1, // 1 credit per language
};

// Local storage keys
const STORAGE_KEYS = {
  CREDITS: 'user_credits',
  TRANSACTIONS: 'credit_transactions',
  USER_ID: 'user_id',
};

// Generate or get user ID
export function getUserId(): string {
  if (typeof window === 'undefined') return 'server-user';
  
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
}

// Get user's credit balance
export function getCreditBalance(): CreditBalance {
  if (typeof window === 'undefined') {
    return { userId: 'server-user', credits: 0, lastUpdated: new Date() };
  }

  const userId = getUserId();
  const stored = localStorage.getItem(STORAGE_KEYS.CREDITS);
  
  if (stored) {
    const balance = JSON.parse(stored);
    return {
      ...balance,
      lastUpdated: new Date(balance.lastUpdated),
    };
  }

  // Default: give new users 10 free credits
  const defaultBalance: CreditBalance = {
    userId,
    credits: 10,
    lastUpdated: new Date(),
  };

  localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(defaultBalance));
  return defaultBalance;
}

// Update credit balance
export function updateCreditBalance(newBalance: number): CreditBalance {
  const userId = getUserId();
  const balance: CreditBalance = {
    userId,
    credits: Math.max(0, newBalance),
    lastUpdated: new Date(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(balance));
  }

  return balance;
}

// Add credits (for purchases)
export function addCredits(amount: number, stripePaymentIntentId?: string): CreditBalance {
  const currentBalance = getCreditBalance();
  const newBalance = currentBalance.credits + amount;
  
  // Record transaction
  recordTransaction({
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: currentBalance.userId,
    amount,
    type: 'purchase',
    description: `Purchased ${amount} credits`,
    stripePaymentIntentId,
    timestamp: new Date(),
  });

  return updateCreditBalance(newBalance);
}

// Deduct credits (for usage)
export function deductCredits(amount: number, description: string): boolean {
  const currentBalance = getCreditBalance();
  
  if (currentBalance.credits < amount) {
    return false; // Insufficient credits
  }

  // Record transaction
  recordTransaction({
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: currentBalance.userId,
    amount: -amount,
    type: 'usage',
    description,
    timestamp: new Date(),
  });

  updateCreditBalance(currentBalance.credits - amount);
  return true;
}

// Calculate credits required for description generation
export function calculateCreditsRequired(
  languages: string[],
  model: string
): number {
  const baseCredits = CREDIT_USAGE.baseCreditsPerDescription;
  const modelMultiplier = CREDIT_USAGE.modelMultipliers[model as keyof typeof CREDIT_USAGE.modelMultipliers] || 1;
  const languageCount = languages.length;
  
  return baseCredits * modelMultiplier * languageCount;
}

// Record a credit transaction
function recordTransaction(transaction: CreditTransaction): void {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  const transactions: CreditTransaction[] = stored ? JSON.parse(stored) : [];
  
  transactions.push(transaction);
  
  // Keep only the last 100 transactions
  if (transactions.length > 100) {
    transactions.splice(0, transactions.length - 100);
  }

  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

// Get transaction history
export function getTransactionHistory(): CreditTransaction[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!stored) return [];

  const transactions = JSON.parse(stored);
  return transactions.map((txn: any) => ({
    ...txn,
    timestamp: new Date(txn.timestamp),
  }));
}

// Check if user has sufficient credits
export function hasSufficientCredits(requiredCredits: number): boolean {
  const balance = getCreditBalance();
  return balance.credits >= requiredCredits;
}
