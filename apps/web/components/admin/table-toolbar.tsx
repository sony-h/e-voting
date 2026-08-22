'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ToolbarOption {
  value: string;
  label: string;
}

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: ToolbarOption[];
  sortBy?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: ToolbarOption[];
}

export function TableToolbar({
  search,
  onSearchChange,
  placeholder = 'Cari...',
  statusFilter,
  onStatusChange,
  statusOptions,
  sortBy,
  onSortChange,
  sortOptions,
}: TableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 pl-9"
          aria-label={placeholder}
        />
      </div>
      {statusOptions && onStatusChange && (
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Filter status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {sortOptions && onSortChange && (
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Urutkan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
