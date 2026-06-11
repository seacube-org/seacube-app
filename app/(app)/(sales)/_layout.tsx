import { Stack } from "expo-router";

// Pathless route group for the sales documents (quotes / orders / invoices /
// payments / credit-notes). Each entity folder owns its own Stack; this wraps
// them so the group is a valid layout segment on both web and native.
export default function SalesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
