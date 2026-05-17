import { Tabs } from 'expo-router';
export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: '首页' }} />
      <Tabs.Screen name="(sales)" options={{ title: '销售', href: null }} />
      <Tabs.Screen name="(purchases)" options={{ title: '采购', href: null }} />
      <Tabs.Screen name="(contacts)" options={{ title: '联系人', href: null }} />
      <Tabs.Screen name="(inventory)" options={{ title: '库存', href: null }} />
      <Tabs.Screen name="(production)" options={{ title: '生产', href: null }} />
      <Tabs.Screen name="(logistics)" options={{ title: '物流', href: null }} />
      <Tabs.Screen name="(settings)" options={{ title: '设置', href: null }} />
    </Tabs>
  );
}
