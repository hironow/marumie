import { PreviewHouseholdCsvUsecase } from "@/server/usecases/preview-household-csv-usecase";

describe("PreviewHouseholdCsvUsecase (happy path)", () => {
  test("parses CSV and classifies income/expense", async () => {
    const csv = [
      "transaction_no,transaction_date,debit_account,debit_sub_account,debit_amount,credit_account,credit_sub_account,credit_amount,description",
      "1,2025-10-01,食費,,1500,普通預金,,1500,スーパー",
      "2,2025-10-02,普通預金,,100000,勤務収入,,100000,給与",
    ].join("\n");

    const usecase = new PreviewHouseholdCsvUsecase();
    const result = await usecase.execute({ csvContent: csv, politicalOrganizationId: "1" });

    expect(result.count).toBe(2);
    expect(result.invalidCount).toBe(0);
    const [t1, t2] = result.transactions;
    expect(t1.transaction_type).toBe("expense");
    expect(t2.transaction_type).toBe("income");
  });
});

