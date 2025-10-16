import { parse } from "csv-parse/sync";

export interface HouseholdCsvRecord {
  transaction_no: string;
  transaction_date: string; // YYYY-MM-DD
  debit_account: string;
  debit_sub_account?: string;
  debit_amount: string;
  credit_account: string;
  credit_sub_account?: string;
  credit_amount: string;
  description?: string;
}

export class HouseholdCsvLoader {
  load(csvContent: string): HouseholdCsvRecord[] {
    if (!csvContent || csvContent.trim() === "") return [];
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as HouseholdCsvRecord[];
    return records;
  }
}
