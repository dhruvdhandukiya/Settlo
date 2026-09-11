// lib/currency.js

export const DEFAULT_CURRENCY = "INR"; // Default to INR or USD

export const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳", locale: "en-IN" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧", locale: "en-GB" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪", locale: "ar-AE" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺", locale: "en-AU" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬", locale: "en-SG" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵", locale: "ja-JP" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦", locale: "ar-SA" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭", locale: "de-CH" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳", locale: "zh-CN" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", flag: "🇳🇿", locale: "en-NZ" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", flag: "🇧🇷", locale: "pt-BR" },
  { code: "THB", symbol: "฿", name: "Thai Baht", flag: "🇹🇭", locale: "th-TH" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", flag: "🇲🇾", locale: "ms-MY" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", flag: "🇮🇩", locale: "id-ID" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", flag: "🇰🇷", locale: "ko-KR" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", flag: "🇹🇷", locale: "tr-TR" },
  { code: "ZAR", symbol: "R", name: "South African Rand", flag: "🇿🇦", locale: "en-ZA" },
];

export const CURRENCY_MAP = CURRENCIES.reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {});

export function getCurrencyDetails(currencyCode = DEFAULT_CURRENCY) {
  const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase();
  return (
    CURRENCY_MAP[code] || {
      code,
      symbol: code,
      name: code,
      flag: "🌐",
      locale: "en-US",
    }
  );
}

export function getCurrencySymbol(currencyCode = DEFAULT_CURRENCY) {
  return getCurrencyDetails(currencyCode).symbol;
}

export function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY, options = {}) {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  const curr = getCurrencyDetails(currencyCode);
  const isNegative = num < 0;
  const absVal = Math.abs(num);

  const formattedNum = absVal.toLocaleString(curr.locale || "en-US", {
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  });

  const sign = isNegative ? "-" : options.showPositiveSign ? "+" : "";

  // Prefix symbol cleanly
  return `${sign}${curr.symbol}${formattedNum}`;
}
