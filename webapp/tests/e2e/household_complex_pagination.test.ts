import fs from "fs";
import path from "path";

// Mock Next.js cache
jest.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

let loadTransactionsPageData: any;

const executeMock = jest.fn(async (params: any) => ({
  transactions: Array(Math.min(params.perPage, 50)).fill(0).map((_, i) => ({ id: String(i + 1) })),
  total: params.__total,
  page: params.page,
  perPage: params.perPage,
  totalPages: Math.ceil(params.__total / params.perPage),
  politicalOrganizations: [{ slug: params.slugs[0], displayName: "Org" }],
  lastUpdatedAt: new Date("2025-10-01T00:00:00Z").toISOString(),
}));

jest.mock("@/server/usecases/get-transactions-by-slug-usecase", () => ({
  GetTransactionsBySlugUsecase: jest.fn().mockImplementation(() => ({ execute: executeMock })),
}));

describe("E2E: complex CSV pagination expectations", () => {
  beforeAll(async () => {
    ({ loadTransactionsPageData } = await import("@/server/loaders/load-transactions-page-data"));
  });
  beforeEach(() => executeMock.mockClear());

  test("totalPages computed from complex CSV line count", async () => {
    const csvPath = path.resolve(__dirname, "../../..", "data/household_complex_A.csv");
    const csv = fs.readFileSync(csvPath, "utf8");
    const totalLines = csv.trim().split("\n").length - 1; // minus header

    const perPage = 50;
    const expectedPages = Math.ceil(totalLines / perPage);

    // inject total into params via non-public field
    const params: any = { slugs: ["org"], page: 1, perPage, financialYear: 2025, __total: totalLines };
    const data = await loadTransactionsPageData(params);
    expect(data.total).toBe(totalLines);
    expect(data.totalPages).toBe(expectedPages);
  });
});
