import { useState } from "react";
import { App, Button, Space } from "antd";
import i18n from "@/locale/i18n";
import type { DocAction } from "./types";

type Props = {
  actions: DocAction[];
  /** Runs one action (caller performs the request + reload); may throw. */
  onRun: (action: DocAction) => Promise<void>;
};

/**
 * Renders the legal status-transition / conversion buttons for a document. The
 * parent decides which actions are legal for the current status; this only owns
 * the per-button loading state and the optional confirm dialog.
 */
export default function StatusActionBar({ actions, onRun }: Props) {
  const { modal } = App.useApp();
  const [running, setRunning] = useState<string | null>(null);

  if (actions.length === 0) return null;

  const run = async (a: DocAction) => {
    setRunning(a.key);
    try {
      await onRun(a);
    } finally {
      setRunning(null);
    }
  };

  const handle = (a: DocAction) => {
    if (a.confirm) {
      modal.confirm({
        title: a.label,
        content: a.confirm,
        okText: i18n.t("common.confirm", { defaultValue: "确认" }),
        cancelText: i18n.t("common.cancel", { defaultValue: "取消" }),
        okButtonProps: { danger: a.danger },
        onOk: () => run(a),
      });
    } else {
      void run(a);
    }
  };

  return (
    <Space wrap>
      {actions.map((a) => (
        <Button
          key={a.key}
          type={a.primary ? "primary" : "default"}
          danger={a.danger}
          loading={running === a.key}
          disabled={running != null && running !== a.key}
          onClick={() => handle(a)}
        >
          {a.label}
        </Button>
      ))}
    </Space>
  );
}
