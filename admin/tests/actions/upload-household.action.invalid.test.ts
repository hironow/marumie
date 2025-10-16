import { uploadHousehold } from "@/server/actions/upload-household";

jest.mock("@/server/usecases/save-preview-transactions-usecase", () => {
  class MockUsecase {
    async execute() {
      return { processedCount: 0, savedCount: 0, skippedCount: 0, errors: [] };
    }
  }
  return { SavePreviewTransactionsUsecase: MockUsecase };
});

describe("uploadHousehold action (invalid inputs)", () => {
  test("throws when validTransactions is not an array", async () => {
    await expect(
      uploadHousehold({ politicalOrganizationId: "1", validTransactions: null as any }),
    ).rejects.toThrow(/有効なトランザクションデータ/);
  });

  test("throws when politicalOrganizationId is missing", async () => {
    await expect(
      uploadHousehold({ politicalOrganizationId: "", validTransactions: [] as any }),
    ).rejects.toThrow(/組織ID/);
  });
});

