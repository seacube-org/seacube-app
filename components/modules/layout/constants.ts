export const SIDER_WIDTH = 220;
export const SIDER_COLLAPSED_WIDTH = 56;
export const HEADER_HEIGHT = 52;

// Org-creation locale options — mirror apps/core/models/choices.Currency and
// Organization.Timezone on the backend (kept curated, Zoho-Books style).
export const CURRENCY_OPTIONS = [
  { value: "CNY", label: "Chinese Yuan (CNY)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "HKD", label: "Hong Kong Dollar (HKD)" },
  { value: "SGD", label: "Singapore Dollar (SGD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
];

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Shanghai", label: "Asia/Shanghai (UTC+8)" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong (UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (UTC+4)" },
  { value: "Europe/London", label: "Europe/London (UTC+0/+1)" },
  { value: "Europe/Paris", label: "Europe/Paris (UTC+1/+2)" },
  { value: "America/New_York", label: "America/New_York (UTC-5/-4)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8/-7)" },
  { value: "UTC", label: "UTC (UTC+0)" },
];

export const ITEM_ROUTES: Record<string, string> = {
  dashboard: "/(app)",
  quotes: "/(app)/(sales)/quotes",
  salesOrders: "/(app)/(sales)/orders",
  invoices: "/(app)/(sales)/invoices",
  payments: "/(app)/(sales)/payments",
  creditNotes: "/(app)/(sales)/credit-notes",
  purchaseOrders: "/(app)/(purchases)/purchase-orders",
  goodsReceipts: "/(app)/(purchases)/goods-receipts",
  bills: "/(app)/(purchases)/bills",
  vendorPayments: "/(app)/(purchases)/vendor-payments",
  vendorCredits: "/(app)/(purchases)/vendor-credits",
  contacts: "/(app)/(contacts)",
  products: "/(app)/(inventory)/products",
  warehouses: "/(app)/(inventory)/warehouses",
  adjustments: "/(app)/(inventory)/adjustments",
  production: "/(app)/(production)",
  logistics: "/(app)/(logistics)",
  settings: "/(app)/(settings)",
};

export const PAGE_TO_KEY: Record<string, string> = {
  orders: "salesOrders",
  "credit-notes": "creditNotes",
  "purchase-orders": "purchaseOrders",
  "goods-receipts": "goodsReceipts",
  "vendor-payments": "vendorPayments",
  "vendor-credits": "vendorCredits",
};
