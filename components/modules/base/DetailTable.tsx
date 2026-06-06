import { Table } from "antd";
import type { TableProps } from "antd";

/**
 * A simple client-side table styled to match the list {@link DataTable}'s
 * Bigin/CRM look (header tint, row height, thin grid borders, hover). For
 * detail-page sub-tables that don't need server fetch / pagination / resize —
 * pass `columns` + `dataSource` like a plain antd Table.
 */
export default function DetailTable<T extends object = Record<string, unknown>>(props: TableProps<T>) {
  return (
    <div className="seacube-detail-table">
      <style>{`
        .seacube-detail-table .ant-table { background: transparent; }
        .seacube-detail-table .ant-table-thead > tr > th {
          height: 32px;
          padding: 0 12px;
          background: #fbfcfd;
          border-bottom: 1px solid #dfe7ef;
          border-inline-end: 1px solid #dfe7ef;
          color: #1f2937;
          font-size: 12.5px;
          font-weight: 600;
        }
        .seacube-detail-table .ant-table-thead > tr > th::before { display: none; }
        .seacube-detail-table .ant-table-tbody > tr > td {
          height: 44px;
          padding: 0 12px;
          border-bottom: 1px solid #edf1f5;
          border-inline-end: 1px solid #edf1f5;
          color: #2f3542;
          font-size: 13px;
          vertical-align: middle;
        }
        .seacube-detail-table .ant-table-thead > tr > th:last-child,
        .seacube-detail-table .ant-table-tbody > tr > td:last-child { border-inline-end: 0; }
        .seacube-detail-table .ant-table-tbody > tr:hover > td { background: #f6fbff; }
      `}</style>
      <Table size="small" pagination={false} {...props} />
    </div>
  );
}
