import { ReactNode } from 'react';

interface TableProps {
  columns: string[];
  children?: ReactNode;
}

export function Table({ columns, children }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg/60">
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-medium text-muted">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
