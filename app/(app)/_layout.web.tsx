import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Slot, useRouter, useSegments, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import i18n from '@/locale/i18n';

type NavItem = {
  key: string;
  label: () => string;
  route: string;
  children?: { key: string; label: () => string; route: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: () => i18n.t('nav.dashboard'), route: '/(app)' },
  {
    key: 'sales', label: () => i18n.t('nav.sales'), route: '/(app)/(sales)',
    children: [
      { key: 'quotes', label: () => i18n.t('sales.quotes'), route: '/(app)/(sales)/quotes' },
      { key: 'salesOrders', label: () => i18n.t('sales.salesOrders'), route: '/(app)/(sales)/orders' },
      { key: 'invoices', label: () => i18n.t('sales.invoices'), route: '/(app)/(sales)/invoices' },
      { key: 'payments', label: () => i18n.t('sales.payments'), route: '/(app)/(sales)/payments' },
      { key: 'creditNotes', label: () => i18n.t('sales.creditNotes'), route: '/(app)/(sales)/credit-notes' },
    ],
  },
  {
    key: 'purchases', label: () => i18n.t('nav.purchases'), route: '/(app)/(purchases)',
    children: [
      { key: 'purchaseOrders', label: () => i18n.t('purchases.purchaseOrders'), route: '/(app)/(purchases)/purchase-orders' },
      { key: 'goodsReceipts', label: () => i18n.t('purchases.goodsReceipts'), route: '/(app)/(purchases)/goods-receipts' },
      { key: 'bills', label: () => i18n.t('purchases.bills'), route: '/(app)/(purchases)/bills' },
      { key: 'vendorPayments', label: () => i18n.t('purchases.vendorPayments'), route: '/(app)/(purchases)/vendor-payments' },
      { key: 'vendorCredits', label: () => i18n.t('purchases.vendorCredits'), route: '/(app)/(purchases)/vendor-credits' },
    ],
  },
  { key: 'contacts', label: () => i18n.t('nav.contacts'), route: '/(app)/(contacts)' },
  {
    key: 'inventory', label: () => i18n.t('nav.inventory'), route: '/(app)/(inventory)',
    children: [
      { key: 'products', label: () => i18n.t('inventory.products'), route: '/(app)/(inventory)/products' },
      { key: 'warehouses', label: () => i18n.t('inventory.warehouses'), route: '/(app)/(inventory)/warehouses' },
      { key: 'adjustments', label: () => i18n.t('inventory.adjustments'), route: '/(app)/(inventory)/adjustments' },
    ],
  },
  { key: 'production', label: () => i18n.t('nav.production'), route: '/(app)/(production)' },
  { key: 'logistics', label: () => i18n.t('nav.logistics'), route: '/(app)/(logistics)' },
  { key: 'settings', label: () => i18n.t('nav.settings'), route: '/(app)/(settings)' },
];

function SidebarItem({ item, currentPath }: { item: NavItem; currentPath: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const isActive = currentPath.startsWith(item.route);

  if (item.children) {
    return (
      <View>
        <TouchableOpacity
          style={[styles.navItem, isActive && styles.navItemActive]}
          onPress={() => setExpanded((e) => !e)}
        >
          <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
            {item.label()}
          </Text>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </TouchableOpacity>
        {expanded && item.children.map((child) => {
          const childActive = currentPath.startsWith(child.route);
          return (
            <TouchableOpacity
              key={child.key}
              style={[styles.subNavItem, childActive && styles.navItemActive]}
              onPress={() => router.push(child.route as Href)}
            >
              <Text style={[styles.subNavLabel, childActive && styles.navLabelActive]}>
                {child.label()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.navItem, isActive && styles.navItemActive]}
      onPress={() => router.push(item.route as Href)}
    >
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
        {item.label()}
      </Text>
    </TouchableOpacity>
  );
}

export default function WebAppLayout() {
  useLocaleStore(s => s.locale); // re-render when locale resolves
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const currentPath = '/' + segments.join('/');

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SeaCube</Text>
        </View>
        <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
          {NAV_ITEMS.map((item) => (
            <SidebarItem key={item.key} item={item} currentPath={currentPath} />
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.footerUser} numberOfLines={1}>
            {user?.first_name || user?.username}
          </Text>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logoutText}>{i18n.t('auth.logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#F4F5F7' },
  sidebar: { width: 220, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#E5E7EB', flexDirection: 'column' },
  logo: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  logoText: { fontSize: 20, fontWeight: '700', color: '#1A73E8' },
  nav: { flex: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, marginHorizontal: 8, marginVertical: 1 },
  navItemActive: { backgroundColor: '#EBF3FE' },
  navLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  navLabelActive: { color: '#1A73E8', fontWeight: '600' },
  chevron: { fontSize: 12, color: '#9CA3AF' },
  subNavItem: { paddingVertical: 8, paddingLeft: 32, paddingRight: 16, borderRadius: 6, marginHorizontal: 8, marginVertical: 1 },
  subNavLabel: { fontSize: 13, color: '#6B7280' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  footerUser: { fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: '500' },
  logoutText: { fontSize: 13, color: '#6B7280' },
  content: { flex: 1 },
});
