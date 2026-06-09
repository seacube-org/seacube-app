import { Stack } from "expo-router";

// Stack so the list (index) and full-page detail ([id]) push/pop correctly on
// both web (rendered inside the app Slot) and native. Products is its own
// top-level module (Zoho Books "Items"), separate from Inventory.
export default function ProductsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
