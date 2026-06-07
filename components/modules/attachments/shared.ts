import { FileOutlined, FileImageOutlined, FilePdfOutlined } from "@ant-design/icons";

export const isImage = (mime: string) => mime.startsWith("image/");
export const isPdf = (mime: string) => mime === "application/pdf";

// AntD icon that hints at a file's type from its MIME (shared by the panel list
// and the previewer's thumbnail strip).
export function fileTypeIcon(mime: string) {
  if (isImage(mime)) return FileImageOutlined;
  if (isPdf(mime)) return FilePdfOutlined;
  return FileOutlined;
}
