import { Redirect } from "expo-router";
import type { Href } from "expo-router";

// Settings landing → first section.
export default function SettingsIndex() {
  return <Redirect href={"/(settings)/general" as Href} />;
}
