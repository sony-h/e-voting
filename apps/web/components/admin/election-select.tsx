'use client';

import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ElectionSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function ElectionSelect({ value, onChange }: ElectionSelectProps) {
  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: listElections,
  });

  return (
    <div className="space-y-2">
      <Label>Election</Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading || !elections?.length}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder={isLoading ? 'Memuat...' : 'Pilih election'} />
        </SelectTrigger>
        <SelectContent>
          {elections?.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.title} ({e.status})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
