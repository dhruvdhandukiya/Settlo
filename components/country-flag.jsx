"use client";

import React, { useState } from "react";

// Mapping from Currency Code to ISO 3166-1 alpha-2 Country Code
const CURRENCY_TO_COUNTRY = {
  INR: "in",
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  AED: "ae",
  CAD: "ca",
  AUD: "au",
  SGD: "sg",
  JPY: "jp",
  SAR: "sa",
  CHF: "ch",
  CNY: "cn",
  NZD: "nz",
  BRL: "br",
  THB: "th",
  MYR: "my",
  IDR: "id",
  KRW: "kr",
  TRY: "tr",
  ZAR: "za",
};

export function CountryFlag({ code = "INR", fallbackEmoji = "🌐", className = "w-4 h-3 rounded-[2px]" }) {
  const [hasError, setHasError] = useState(false);
  const countryCode = CURRENCY_TO_COUNTRY[code?.toUpperCase()] || code?.slice(0, 2)?.toLowerCase();

  if (!countryCode || hasError) {
    return <span className="inline-block text-sm leading-none shrink-0">{fallbackEmoji}</span>;
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      srcSet={`https://flagcdn.com/w80/${countryCode}.png 2x`}
      alt={`${code} flag`}
      width={20}
      height={14}
      className={`inline-block object-cover shadow-[0_0_1px_rgba(0,0,0,0.3)] shrink-0 align-middle ${className}`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
