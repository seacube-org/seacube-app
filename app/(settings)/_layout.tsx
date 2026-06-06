import { Slot } from "expo-router";

// Native fallback for the web-only settings layout (_layout.web.tsx).
// The rich settings shell (left sub-nav + antd sections) is web-only; on
// native we simply render the active section's placeholder.
export default function SettingsLayout() {
  return <Slot />;
}
