import * as XLSX from 'xlsx';

export function parseExcelRows<T = Record<string, unknown>>(
  buffer: Buffer,
): T[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  return XLSX.utils.sheet_to_json<T>(sheet ?? {});
}

export function buildExcelBuffer<T>(rows: T[], sheetName: string): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
