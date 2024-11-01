import { type JsonValue } from "@prisma/client/runtime/library";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";

import CampaignDelete from "~/components/CampaignDelete";

type Campaign = {
  id: string;
  title: string;
  s3Key: string;
  status: string;
  segmentList: JsonValue;
  totalEmailSent: number | null;
  scheduleKey: string | null;
  scheduleDate: string | null;
};

interface CampaignTableProps {
  data: Campaign[];
  onDelete: (id: string, s3Key: string, isScheduled: boolean) => void;
}

export default function CampaignTable({ data, onDelete }: CampaignTableProps) {
  const columnHelper = createColumnHelper<Campaign>();
  const columns = [
    columnHelper.accessor("title", {
      header: () => "Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("status", {
      header: () => "Status",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("segmentList", {
      header: () => "Audience",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("totalEmailSent", {
      header: () => "Total emails",
      cell: (info) => info.getValue() ?? "N/A",
    }),
    columnHelper.display({
      id: "actions",
      header: () => "Actions",
      cell: (info) => {
        const { id, s3Key, scheduleDate } = info.row.original;
        return (
          <CampaignDelete
            id={id}
            s3Key={s3Key}
            scheduleDate={scheduleDate}
            onDelete={onDelete}
          />
        );
      },
    }),
  ];

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                <div>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}