import { useEffect, useState, type CSSProperties } from "react";
import { Spin } from "antd";
import { FileImageOutlined } from "@ant-design/icons";
import { fetchFileBlob, AuthError } from "@/services/DataService";
import { useDataService } from "@/hooks/core/useDataService";

type Props = { url: string; alt?: string; style?: CSSProperties };

/**
 * Renders an image whose bytes live behind a permission-checked endpoint: fetches
 * it as an authenticated blob and shows the resulting object URL (a plain
 * `<img src>` can't send the auth header). Used for product gallery thumbnails.
 */
export default function AuthImage({ url, alt, style }: Props) {
  const { handleError } = useDataService();
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setState("loading");
    setSrc(null);
    fetchFileBlob(url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 after a failed refresh → route through the app error path (logout/redirect).
        // handleError rethrows, so swallow the rejection to avoid an unhandled promise.
        if (err instanceof AuthError) {
          void handleError(err).catch(() => {});
          return;
        }
        setState("error");
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, handleError]);

  if (state === "loading") return <Spin size="small" />;
  if (state === "error" || !src) return <FileImageOutlined style={{ fontSize: 22, color: "#bbb" }} />;
  return <img src={src} alt={alt} style={style} />;
}
