import { useState, type CSSProperties, type ReactNode } from "react";
import { Typography, theme } from "antd";
import { DownOutlined } from "@ant-design/icons";

export type SectionProps = {
  /** Section heading. Rendered strong at the size set by `size`. */
  title: ReactNode;
  children: ReactNode;
  /** Add a chevron + toggling and animate the content (default false → a static
   *  titled section that's always open). Collapsed content stays mounted (clipped,
   *  not unmounted) so Form fields inside remain registered. */
  collapsible?: boolean;
  /** Initial open state for the uncontrolled component (default: open). */
  defaultOpen?: boolean;
  /** Controlled open state — pair with onOpenChange to drive it externally. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Right-aligned content shown just before the chevron (e.g. a count tag). */
  extra?: ReactNode;
  /** First section in a stack — drops the top margin so it sits flush. */
  first?: boolean;
  /** Title prominence: "sm" (13px, detail panes) or "md" (15px, form sections). */
  size?: "sm" | "md";
  style?: CSSProperties;
};

/**
 * A titled section with an underlined header — the shared layout primitive for
 * grouping fields in forms and content in detail panes. Pass `collapsible` to make
 * it an accordion: a chevron toggles the body, which animates via the grid-rows
 * `0fr → 1fr` technique (no JS measuring) while keeping its children mounted so
 * Form fields stay registered. Stack several and mark the first `first`.
 */
export default function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  extra,
  first,
  size = "sm",
  style,
}: SectionProps) {
  const { token } = theme.useToken();
  const [openState, setOpenState] = useState(defaultOpen);

  const controlled = openProp !== undefined;
  const open = collapsible ? (controlled ? openProp : openState) : true;

  const toggle = () => {
    if (!collapsible) return;
    const next = !open;
    if (!controlled) setOpenState(next);
    onOpenChange?.(next);
  };

  // A <div> (not <button>) so the header can never submit a surrounding <Form>.
  // The chevron sits right next to the title (original Section look); any `extra`
  // is pushed to the far right.
  const header = (
    <div
      onClick={toggle}
      role={collapsible ? "button" : undefined}
      aria-expanded={collapsible ? open : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        color: token.colorText,
        cursor: collapsible ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      <Typography.Text strong style={{ fontSize: size === "md" ? 15 : 13 }}>
        {title}
      </Typography.Text>
      {collapsible && (
        <DownOutlined
          style={{
            flex: "none",
            fontSize: 11,
            color: token.colorTextTertiary,
            // Down when open, pointing right when collapsed (original Section).
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: `transform ${token.motionDurationMid} ease`,
          }}
        />
      )}
      {extra != null ? <span style={{ flex: "none", marginInlineStart: "auto" }}>{extra}</span> : null}
    </div>
  );

  const body = <div style={{ padding: "12px 0 16px" }}>{children}</div>;

  return (
    <div style={{ marginTop: first ? 0 : 4, ...style }}>
      {header}
      {collapsible ? (
        <div
          style={{
            display: "grid",
            gridTemplateRows: open ? "1fr" : "0fr",
            transition: `grid-template-rows ${token.motionDurationMid} ease`,
          }}
          aria-hidden={!open}
        >
          <div style={{ overflow: "hidden" }}>{body}</div>
        </div>
      ) : (
        body
      )}
    </div>
  );
}
