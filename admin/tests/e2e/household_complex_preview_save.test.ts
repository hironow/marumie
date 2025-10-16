import fs from "fs";
import path from "path";
import { PreviewHouseholdCsvUsecase } from "@/server/usecases/preview-household-csv-usecase";
import { SavePreviewTransactionsUsecase } from "@/server/usecases/save-preview-transactions-usecase";

// In-memory TransactionRepository mock implementing the minimal methods used by SavePreviewTransactionsUsecase
class InMemoryTransactionRepository {
  public saved: any[] = [];

  async createMany(inputs: any[]) {
    this.saved.push(...inputs);
    // Return Transaction[]-like objects
    return inputs.map((i, idx) => ({
      id: String(idx + 1),
      political_organization_id: i.political_organization_id,
      transaction_no: i.transaction_no,
      transaction_date: i.transaction_date,
      financial_year: i.financial_year,
      transaction_type: i.transaction_type,
      debit_account: i.debit_account,
      debit_amount: i.debit_amount,
      credit_account: i.credit_account,
      credit_amount: i.credit_amount,
      description: i.description,
      friendly_category: i.friendly_category,
      memo: i.memo,
      category_key: i.category_key,
      label: i.label,
      hash: i.hash,
      created_at: new Date(),
      updated_at: new Date(),
    }));
  }

  async updateMany(_data: any[]) {
    return [];
  }
}

describe("E2E: household complex CSV preview + save (in-memory)", () => {
  test("previews and saves all rows from complex CSV", async () => {
    const csvPath = path.resolve(__dirname, "../../..", "data/household_complex_A.csv");
    const csv = fs.readFileSync(csvPath, "utf8");

    const preview = new PreviewHouseholdCsvUsecase();
    const result = await preview.execute({ csvContent: csv, politicalOrganizationId: "1" });
    // Should parse many rows (header excluded)
    expect(result.count).toBeGreaterThan(50);
    expect(result.invalidCount).toBe(0);

    const repo = new InMemoryTransactionRepository();
    const saver = new SavePreviewTransactionsUsecase(repo as any);
    const saveRes = await saver.execute({
      validTransactions: result.transactions,
      politicalOrganizationId: "1",
    });

    expect(saveRes.processedCount).toBe(result.count);
    expect(saveRes.savedCount).toBe(result.count);
    expect(saveRes.skippedCount).toBe(0);
    expect(repo.saved.length).toBe(result.count);
  });
});
