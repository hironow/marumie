import { SavePreviewTransactionsUsecase } from "@/server/usecases/save-preview-transactions-usecase";

describe("SavePreviewTransactionsUsecase update path", () => {
  test("updates existing transactions when status is 'update'", async () => {
    const txRepo = {
      createMany: jest.fn(async (inputs: any[]) => inputs.map((i: any, idx: number) => ({ id: String(idx + 1), ...i }))),
      updateMany: jest.fn(async (data: any[]) => data.map((d: any, idx: number) => ({ id: String(idx + 100), ...d.update }))),
    } as any;

    const usecase = new SavePreviewTransactionsUsecase(txRepo);

    const previewTxs: any[] = [
      // Will be inserted
      {
        political_organization_id: "1",
        transaction_no: "INS-001",
        transaction_date: new Date("2025-10-01"),
        transaction_type: "expense",
        debit_account: "食費",
        debit_amount: 1500,
        credit_account: "普通預金",
        credit_amount: 1500,
        description: "",
        label: "",
        friendly_category: "食費",
        memo: "",
        category_key: "house.food",
        hash: "h1",
        status: "insert",
        errors: [],
      },
      // Will be updated (same transaction_no exists with different hash)
      {
        political_organization_id: "1",
        transaction_no: "UPD-001",
        transaction_date: new Date("2025-10-02"),
        transaction_type: "income",
        debit_account: "普通預金",
        debit_amount: 0,
        credit_account: "勤務収入",
        credit_amount: 100000,
        description: "",
        label: "給与",
        friendly_category: "勤務収入",
        memo: "",
        category_key: "income.salary",
        hash: "h2-new",
        status: "update",
        errors: [],
      },
    ];

    const result = await usecase.execute({ validTransactions: previewTxs, politicalOrganizationId: "1" });
    expect(result.processedCount).toBe(2);
    expect(result.savedCount).toBe(2);
    expect(txRepo.createMany).toHaveBeenCalledTimes(1);
    expect(txRepo.updateMany).toHaveBeenCalledTimes(1);
  });
});

