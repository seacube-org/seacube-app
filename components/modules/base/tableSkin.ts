// Shared "Bigin/CRM" table skin — header tint, fixed row height, thin grid
// borders and row hover — scoped to a root class so the server-side list
// {@link DataTable} and the detail-page {@link DetailTable} stay in visual sync.
// Both render the returned string inside a <style>{...}</style>; DataTable layers
// its list-only extras (column menu, resize, selection, pagination) on top.

export const TABLE_HEADER_HEIGHT = 32;
export const TABLE_ROW_HEIGHT = 38;

/** CSS for the shared table look, scoped under `.${scope}`. */
export function tableSkinCss(scope: string): string {
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
    .${scope} .ant-table-tbody > tr.ant-table-row { height: ${TABLE_ROW_HEIGHT}px !important; }
    .${scope} .ant-table-tbody > tr.ant-table-row > td {
      height: ${TABLE_ROW_HEIGHT}px !important;
      padding: 0 12px !important;
      border-bottom: 1px solid #edf1f5;
      border-inline-end: 1px solid #edf1f5;
      color: #2f3542;
      font-size: 13px;
      line-height: ${TABLE_ROW_HEIGHT}px !important;
      vertical-align: middle;
    }
    .${scope} .ant-table-tbody > tr.ant-table-row:hover > td { background: #f6fbff; }
    .${scope} .ant-table-thead > tr > th:last-child,
    .${scope} .ant-table-tbody > tr.ant-table-row > td:last-child { border-inline-end: 0; }
    /* Square corners — strip antd's themed border-radius from the table block,
       its scroll containers (incl. the fixed header) and the corner header cells. */
    .${scope} .ant-table,
    .${scope} .ant-table-container,
    .${scope} .ant-table-header,
    .${scope} .ant-table-container table,
    .${scope} .ant-table-header table,
    .${scope} .ant-table-thead > tr > th:first-child,
    .${scope} .ant-table-thead > tr > th:last-child { border-radius: 0 !important; }
  `;
}
