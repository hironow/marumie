import { uploadHousehold } from "@/server/actions/upload-household";

jest.mock("@/server/usecases/save-preview-transactions-usecase", () => {
  class MockUsecase {
    async execute() {
      return {
        processedCount: 2,
        savedCount: 2,
        skippedCount: 0,
        errors: [],
      };
    }
  }
  return { SavePreviewTransactionsUsecase: MockUsecase };
});

describe("uploadHousehold action", () => {
  test("saves previewed transactions and returns message", async () => {
    const res = await uploadHousehold({
      politicalOrganizationId: "1",
      validTransactions: [
        {
          political_organization_id: "1",
          transaction_no: "1",
          transaction_date: new Date("2025-10-01"),
          transaction_type: "expense",
          debit_account: "食費",
          debit_amount: 1500,
          credit_account: "普通預金",
          credit_amount: 1500,
          friendly_category: "食費",
          category_key: "house.food",
          hash: "h1",
          status: "insert",
          errors: [],
        },
      ] as any,
    });
    expect(res.ok).toBe(true);
    expect(res.savedCount).toBe(2);
    expect(res.message).toContain("保存");
  });
});

