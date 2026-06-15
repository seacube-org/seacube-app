// Shared "Bigin/CRM" table skin — header tint, fixed row height, thin grid
// borders and row hover — scoped to a root class so the server-side list
// {@link DataTable} and the client-side {@link BasicTable} stay in visual sync.
// Both render the returned string inside a <style>{...}</style>; DataTable layers
// its list-only extras (column menu, resize, selection, pagination) on top.

export const TABLE_HEADER_HEIGHT = 32;
export const TABLE_ROW_HEIGHT = 38;

/** CSS for the shared table look, scoped under `.${scope}`.
 *
 * `autoRowHeight` relaxes the fixed {@link TABLE_ROW_HEIGHT} lock so rows grow to
 * fit multi-line cells (e.g. clamped two-line text): cells get auto height, a
 * readable line-height, vertical block padding and top alignment. Default off —
 * the list/detail tables stay on the compact single-line grid. */
export function tableSkinCss(scope: string, opts?: { autoRowHeight?: boolean }): string {
  const auto = opts?.autoRowHeight ?? false;
  const rowHeight = auto ? "auto" : `${TABLE_ROW_HEIGHT}px`;
  const lineHeight = auto ? "1.45" : `${TABLE_ROW_HEIGHT}px`;
  const padBlock = auto ? "8px" : "0";
  const vAlign = auto ? "top" : "middle";
  return `
    .${scope} .ant-table-thead > tr { height: ${TABLE_HEADER_HEIGHT}px !important; }
    .${scope} .ant-table-thead > tr > th {
      height: ${TABLE_HEADER_HEIGHT}px !important;
      padding: 0 12px !important;
      background: #fbfcfd;
      border-bottom: 1px solid #dfe7ef;
      border-inline-end: 1px solid #dfe7ef;
      color: #1f2937;
      font-size: 12.5px;
      font-weight: 600;
      line-height: ${TABLE_HEADER_HEIGHT}px !important;
    }
    .${scope} .ant-table-thead > tr > th::before { display: none; }
    /* Scope body rules to .ant-table-row: antd v6 renders a hidden measure-row
       (height:0) as the first tbody child to size columns; an unscoped
       !important height would otherwise expose it as a blank row. */
    .${scope} .ant-table-tbody > tr.ant-table-row { height: ${rowHeight} !important; }
    .${scope} .ant-table-tbody > tr.ant-table-row > td {
      height: ${rowHeight} !important;
      padding: ${padBlock} 12px !important;
      border-bottom: 1px solid #edf1f5;
      border-inline-end: 1px solid #edf1f5;
      color: #2f3542;
      font-size: 13px;
      line-height: ${lineHeight} !important;
      vertical-align: ${vAlign};
    }
    .${scope} .ant-table-tbody > tr.ant-table-row:hover > td { background: #f6fbff; }
    .${scope} .ant-table-thead > tr > th:last-child,
    .${scope} .ant-table-tbody > tr.ant-table-row > td:last-child { border-inline-end: 0; }
    /* Square corners — strip antd's themed border-radius from the table block,
       its scroll containers (incl. the fixed header and the horizontal-scroll
       .ant-table-content / .ant-table-body wrappers) and the corner header cells.
       Also zero the logical corner radii (border-start-start-radius etc.): antd
       sets those on the first/last header cells, and a plain border-radius
       shorthand doesn't reliably override a logical longhand — without this the
       top corners re-round once the table is horizontally scrolled. */
    .${scope} .ant-table,
    .${scope} .ant-table-wrapper,
    .${scope} .ant-table-container,
    .${scope} .ant-table-container::before,
    .${scope} .ant-table-container::after,
    .${scope} .ant-table-header,
    .${scope} .ant-table-content,
    .${scope} .ant-table-body,
    .${scope} .ant-table-container table,
    .${scope} .ant-table-header table,
    .${scope} .ant-table-container table > thead > tr:first-child > *,
    .${scope} .ant-table-header table > thead > tr:first-child > *,
    .${scope} .ant-table-thead > tr > th:first-child,
    .${scope} .ant-table-thead > tr > th:last-child {
      border-radius: 0 !important;
      border-start-start-radius: 0 !important;
      border-start-end-radius: 0 !important;
      border-end-start-radius: 0 !important;
      border-end-end-radius: 0 !important;
    }
  `;
}
