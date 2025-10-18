"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Coins } from "lucide-react";
import { getCreditBalance, getCreditBalance as getBalance } from '@/lib/credits';
import { PricingPlan } from '@/lib/types';

interface CreditBalanceProps {
  onPurchaseClick: () => void;
  className?: string;
}

export default function CreditBalance({ onPurchaseClick, className = "" }: CreditBalanceProps) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const updateBalance = () => {
    try {
      const balance = getBalance();
      setCredits(balance.credits);
    } catch (error) {
      console.error('Error getting credit balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateBalance();
    
    // Listen for storage changes to update balance when credits are used/purchased
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_credits') {
        updateBalance();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    const handleCreditUpdate = () => updateBalance();
    window.addEventListener('creditUpdate', handleCreditUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('creditUpdate', handleCreditUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <Card className={`flex items-center justify-between p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">
          {credits} {credits === 1 ? 'Credit' : 'Credits'}
        </span>
      </div>
      <Button 
        size="sm" 
        variant="outline"
        onClick={onPurchaseClick}
        className="gap-1"
      >
        <CreditCard className="h-3 w-3" />
        Buy Credits
      </Button>
    </Card>
  );
}
