import { PreviewHouseholdCsvUsecase } from "@/server/usecases/preview-household-csv-usecase";

jest.mock("@/server/lib/household-csv-loader", () => ({
  HouseholdCsvLoader: class {
    load(csvContent: string) {
      return [
        // invalid accounts (unknown mapping) -> transaction_type null
        {
          transaction_no: "x1",
          transaction_date: "2025-10-01",
          debit_account: "不明",
          debit_amount: "1000",
          credit_account: "謎",
          credit_amount: "1000",
          description: "invalid accounts",
        },
        // invalid date
        {
          transaction_no: "x2",
          transaction_date: "bad-date",
          debit_account: "食費",
          debit_amount: "500",
          credit_account: "普通預金",
          credit_amount: "500",
          description: "invalid date",
        },
      ];
    }
  },
}));

describe("PreviewHouseholdCsvUsecase (invalid cases)", () => {
  test("marks invalid transactions and counts", async () => {
    const usecase = new PreviewHouseholdCsvUsecase();
    const result = await usecase.execute({ csvContent: "dummy", politicalOrganizationId: "1" });
    expect(result.count).toBe(2);
    expect(result.invalidCount).toBe(2);
    expect(result.transactions[0].status).toBe("invalid");
    expect(result.transactions[1].status).toBe("invalid");
  });
});

