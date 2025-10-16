import {
  HouseholdCsvLoader,
  type HouseholdCsvRecord,
} from "../lib/household-csv-loader";
import {
  HouseholdRecordConverter,
  type PreviewHouseholdTransaction,
} from "../lib/household-record-converter";

export interface PreviewHouseholdCsvInput {
  csvContent: string;
  politicalOrganizationId: string;
}

export interface PreviewHouseholdCsvResult {
  transactions: PreviewHouseholdTransaction[];
  count: number;
  invalidCount: number;
}

export class PreviewHouseholdCsvUsecase {
  constructor(
    private csvLoader: HouseholdCsvLoader = new HouseholdCsvLoader(),
    private converter: HouseholdRecordConverter = new HouseholdRecordConverter(),
  ) {}

  async execute(
    input: PreviewHouseholdCsvInput,
  ): Promise<PreviewHouseholdCsvResult> {
    const records: HouseholdCsvRecord[] = this.csvLoader.load(input.csvContent);
    const transactions = records.map((r) =>
      this.converter.convertRow(r, input.politicalOrganizationId),
    );
    const invalidCount = transactions.filter(
      (t) => t.status === "invalid",
    ).length;
    return {
      transactions,
      count: transactions.length,
      invalidCount,
    };
  }
}
