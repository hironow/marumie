import { SavePreviewTransactionsUsecase } from "@/server/usecases/save-preview-transactions-usecase";

describe("SavePreviewTransactionsUsecase skip path", () => {
  test("counts skipped transactions and does not call repository for them", async () => {
    const txRepo = {
      createMany: jest.fn(async (inputs: any[]) => inputs),
      updateMany: jest.fn(async (data: any[]) => data),
    } as any;

    const usecase = new SavePreviewTransactionsUsecase(txRepo);

    const previewTxs: any[] = [
      {
        political_organization_id: "1",
        transaction_no: "SKIP-001",
        transaction_date: new Date("2025-10-01"),
        transaction_type: "expense",
        debit_account: "食費",
        debit_amount: 1500,
        credit_account: "普通預金",
        credit_amount: 1500,
        friendly_category: "食費",
        category_key: "house.food",
        hash: "h-same",
        status: "skip",
        errors: ["重複のためスキップされます"],
      },
      {
        political_organization_id: "1",
        transaction_no: "INS-002",
        transaction_date: new Date("2025-10-02"),
        transaction_type: "income",
        debit_account: "普通預金",
        debit_amount: 0,
        credit_account: "勤務収入",
        credit_amount: 100000,
        friendly_category: "勤務収入",
        category_key: "income.salary",
        hash: "h-new",
        status: "insert",
        errors: [],
      },
    ];

    const result = await usecase.execute({ validTransactions: previewTxs, politicalOrganizationId: "1" });
    expect(result.processedCount).toBe(2);
    expect(result.skippedCount).toBe(1);
    expect(result.savedCount).toBe(1);
    expect(txRepo.createMany).toHaveBeenCalledTimes(1);
    expect(txRepo.updateMany).not.toHaveBeenCalled();
  });
});

