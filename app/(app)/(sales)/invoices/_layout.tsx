import { Stack } from "expo-router";

// Stack so the list (index) and full-page detail ([id]) push/pop correctly on
// both web (rendered inside the app Slot) and native. The module owns its own
// chrome, so no navigator header.
export default function InvoicesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
