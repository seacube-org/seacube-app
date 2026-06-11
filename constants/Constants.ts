// Base API URL — override via .env.development / .env.production.
// These files hold only the PUBLIC API URL (EXPO_PUBLIC_* is inlined into the
// client bundle) — never put secrets here.
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

// Fail fast if a production build is pointed at a plaintext HTTP endpoint:
// JWTs travel in the Authorization header and would be exposed to network MITM.
// localhost/127.0.0.1 stay allowed so local dev over HTTP keeps working.
function resolveApiBaseUrl(url: string): string {
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(url);
  if (!__DEV__ && !url.startsWith("https://") && !isLocalhost) {
    throw new Error(
      `Insecure EXPO_PUBLIC_API_URL in a production build: "${url}". Use an https:// URL.`,
    );
  }
  return url;
}

export const API_BASE_URL = resolveApiBaseUrl(RAW_API_BASE_URL);

// API endpoint mappings (entity name → base URL)
export const API_ENDPOINTS = {
  // Auth
  token: "/api/auth/token/",
  tokenRefresh: "/api/auth/token/refresh/",
  tokenVerify: "/api/auth/token/verify/",
  me: "/api/auth/me/",
  users: "/api/auth/users/",

  // Core
  organizations: "/api/core/organizations/",
  addresses: "/api/core/addresses/",
  contentTypes: "/api/core/content-types/",
  currencies: "/api/core/currencies/",
  optionSets: "/api/core/option-sets/",
  creditPeriods: "/api/core/credit-periods/",

  // Infrastructure
  attachments: "/api/attachments/",
  comments: "/api/comments/",
  auditLogs: "/api/audit/logs/",
  documentTemplates: "/api/document-templates/templates/",
  dataTransferJobs: "/api/data-transfer/jobs/",

  // Accounting
  accounts: "/api/accounting/accounts/",
  journalEntries: "/api/accounting/journal-entries/",

  // Preferences (per-user personalization: saved views/filters, UI state)
  savedViews: "/api/preferences/views/",
  savedViewFields: "/api/preferences/fields/",
  uiState: "/api/preferences/ui-state/",

  // Contacts
  contacts: "/api/contacts/contacts/",

  // Products
  products: "/api/products/products/",
  productAttributes: "/api/products/attributes/",

  // Inventory
  warehouses: "/api/inventory/warehouses/",
  stockBalances: "/api/inventory/stock-balances/",
  stockMovements: "/api/inventory/stock-movements/",
  stockAdjustments: "/api/inventory/adjustments/",

  // Sales
  quotes: "/api/sales/quotes/",
  salesOrders: "/api/sales/orders/",
  invoices: "/api/sales/invoices/",
  paymentsReceived: "/api/sales/payments/",
  creditNotes: "/api/sales/credit-notes/",

  // Purchases
  purchaseOrders: "/api/purchases/purchase-orders/",
  goodsReceipts: "/api/purchases/goods-receipts/",
  bills: "/api/purchases/bills/",
  vendorPayments: "/api/purchases/vendor-payments/",
  vendorCredits: "/api/purchases/vendor-credits/",

  // Production
  productionOrders: "/api/production/orders/",

  // Logistics
  outboundOrders: "/api/logistics/outbound-orders/",
  shipments: "/api/logistics/shipments/",
} as const;
