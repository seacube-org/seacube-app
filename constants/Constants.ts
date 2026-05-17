// Base API URL — override via .env.development / .env.production
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

// API endpoint mappings (entity name → base URL)
export const API_ENDPOINTS = {
  // Auth
  token: '/api/auth/token/',
  tokenRefresh: '/api/auth/token/refresh/',
  tokenVerify: '/api/auth/token/verify/',
  register: '/api/auth/register/',
  me: '/api/auth/me/',
  users: '/api/auth/users/',

  // Core
  organizations: '/api/core/organizations/',
  contentTypes: '/api/core/content-types/',

  // Infrastructure
  attachments: '/api/attachments/',
  comments: '/api/comments/',
  auditLogs: '/api/audit/logs/',
  documentTemplates: '/api/document-templates/templates/',

  // Accounting
  accounts: '/api/accounting/accounts/',
  journalEntries: '/api/accounting/journal-entries/',

  // Contacts
  contacts: '/api/contacts/contacts/',

  // Products
  products: '/api/products/products/',

  // Inventory
  warehouses: '/api/inventory/warehouses/',
  stockBalances: '/api/inventory/stock-balances/',
  stockMovements: '/api/inventory/stock-movements/',
  stockAdjustments: '/api/inventory/adjustments/',

  // Sales
  quotes: '/api/sales/quotes/',
  salesOrders: '/api/sales/orders/',
  invoices: '/api/sales/invoices/',
  paymentsReceived: '/api/sales/payments-received/',
  creditNotes: '/api/sales/credit-notes/',

  // Purchases
  purchaseOrders: '/api/purchases/purchase-orders/',
  goodsReceipts: '/api/purchases/goods-receipts/',
  bills: '/api/purchases/bills/',
  vendorPayments: '/api/purchases/vendor-payments/',
  vendorCredits: '/api/purchases/vendor-credits/',

  // Production
  productionOrders: '/api/production/orders/',

  // Logistics
  outboundOrders: '/api/logistics/outbound-orders/',
  shipments: '/api/logistics/shipments/',
} as const;
