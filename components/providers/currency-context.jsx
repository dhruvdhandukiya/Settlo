"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_CURRENCY,
  CURRENCIES,
  getCurrencyDetails,
  getCurrencySymbol,
  formatCurrency,
} from "@/lib/currency";
import { toast } from "sonner";

const CurrencyContext = createContext({
  currency: DEFAULT_CURRENCY,
  currencyDetails: getCurrencyDetails(DEFAULT_CURRENCY),
  currencySymbol: getCurrencySymbol(DEFAULT_CURRENCY),
  setCurrency: () => {},
  formatAmount: (amount) => String(amount),
  allCurrencies: CURRENCIES,
});

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("settlo_currency");
      if (saved) {
        setCurrencyState(saved);
      }
    } catch {
      // ignore localStorage errors
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync with Convex user preference if authenticated
  let currentUser = undefined;
  try {
    currentUser = useQuery(api.users.getCurrentUser);
  } catch {
    // ignore query failure if not in auth context
  }

  const updateCurrencyMutation = useMutation(api.users.updateUserCurrency);

  useEffect(() => {
    if (currentUser && currentUser.currency && currentUser.currency !== currency) {
      setCurrencyState(currentUser.currency);
      try {
        localStorage.setItem("settlo_currency", currentUser.currency);
      } catch {
        // ignore
      }
    }
  }, [currentUser?.currency]);

  const setCurrency = async (newCode) => {
    const code = (newCode || DEFAULT_CURRENCY).toUpperCase();
    setCurrencyState(code);
    try {
      localStorage.setItem("settlo_currency", code);
    } catch {
      // ignore
    }

    if (currentUser) {
      try {
        await updateCurrencyMutation({ currency: code });
        toast.success(`Currency changed to ${getCurrencySymbol(code)} ${code}`);
      } catch (err) {
        console.warn("Could not persist currency to backend:", err);
      }
    } else {
      toast.success(`Currency changed to ${getCurrencySymbol(code)} ${code}`);
    }
  };

  const currencyDetails = getCurrencyDetails(currency);
  const currencySymbol = currencyDetails.symbol;

  const formatAmount = (amount, overrideCurrencyOrOptions = {}) => {
    if (typeof overrideCurrencyOrOptions === "string") {
      return formatCurrency(amount, overrideCurrencyOrOptions);
    }
    const targetCurrency = overrideCurrencyOrOptions?.currency || currency;
    return formatCurrency(amount, targetCurrency, overrideCurrencyOrOptions);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyDetails,
        currencySymbol,
        setCurrency,
        formatAmount,
        allCurrencies: CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    return {
      currency: DEFAULT_CURRENCY,
      currencyDetails: getCurrencyDetails(DEFAULT_CURRENCY),
      currencySymbol: getCurrencySymbol(DEFAULT_CURRENCY),
      setCurrency: () => {},
      formatAmount: (amt) => formatCurrency(amt, DEFAULT_CURRENCY),
      allCurrencies: CURRENCIES,
    };
  }
  return context;
}
