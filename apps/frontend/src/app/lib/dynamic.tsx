"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Lightweight fallback skeleton for tables
export const TableFallback: React.FC = () => (
  <div className="w-full">
    <div className="h-8 w-1/3 bg-gray-100 animate-pulse rounded mb-3" />
    <div className="h-10 w-full bg-gray-100 animate-pulse rounded mb-2" />
    {Array.from({ length: 6 }).map((_, idx) => (
      <div key={idx} className="h-10 w-full bg-gray-50 animate-pulse rounded mb-2" />
    ))}
  </div>
);

export const DynamicDataTable = dynamic(
  () => import('@/components/ui/data-table').then((m) => m.DataTable as any),
  {
    ssr: false,
    loading: () => <TableFallback />,
  }
) as unknown as typeof import('@/components/ui/data-table').DataTable;




