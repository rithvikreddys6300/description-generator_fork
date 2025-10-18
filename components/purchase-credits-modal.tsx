"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, CreditCard, Star } from "lucide-react";
import { PRICING_PLANS } from '@/lib/credits';
import { getUserId } from '@/lib/credits';
import { loadStripe } from '@stripe/stripe-js';

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    try {
      setLoading(planId);
      const userId = getUserId();

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          successUrl: `${window.location.origin}?payment=success&plan=${planId}`,
          cancelUrl: `${window.location.origin}?payment=cancelled`,
        }),
      });

      const { sessionId, url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Credits
          </DialogTitle>
          <DialogDescription>
            Choose a credit package to continue generating product descriptions.
            Credits never expire and can be used across all features.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative p-6 ${plan.popular ? 'border-blue-500 border-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center space-y-3">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="text-3xl font-bold">
                  ${(plan.price / 100).toFixed(2)}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {plan.credits} Credits
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-600">{plan.description}</p>
                )}
                
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>${((plan.price / 100) / plan.credits).toFixed(3)} per credit</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Never expires</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>All language support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>All AI models</span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full mt-4 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  {loading === plan.id ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing...
                    </div>
                  ) : (
                    `Purchase ${plan.credits} Credits`
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Secure payment processing by Stripe. Your payment information is never stored on our servers.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
