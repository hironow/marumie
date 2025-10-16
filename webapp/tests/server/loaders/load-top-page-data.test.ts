// Mock Next.js cache to avoid incremental cache requirement
jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

// Mock prisma to avoid real DB client
jest.mock("@/server/lib/prisma", () => ({ prisma: {} }));

// Mock usecases to avoid touching repositories
const sankeyExec = jest.fn(async (params: any) => ({
  sankeyData: {
    nodes: [{ id: "n1", label: params.categoryType || "political", nodeType: "total" }],
    links: [],
  },
}));

jest.mock("@/server/usecases/get-sankey-aggregation-usecase", () => ({
  GetSankeyAggregationUsecase: jest.fn().mockImplementation(() => ({
    execute: sankeyExec,
  })),
}));

jest.mock("@/server/usecases/get-transactions-by-slug-usecase", () => ({
  GetTransactionsBySlugUsecase: jest.fn().mockImplementation(() => ({
    execute: jest.fn(async () => ({
      transactions: [],
      total: 0,
      page: 1,
      perPage: 6,
      totalPages: 0,
      politicalOrganizations: [{ slug: "org", displayName: "Org" }],
      lastUpdatedAt: new Date("2025-10-01T00:00:00Z").toISOString(),
    })),
  })),
}));

jest.mock("@/server/usecases/get-monthly-transaction-aggregation-usecase", () => ({
  GetMonthlyTransactionAggregationUsecase: jest.fn().mockImplementation(() => ({
    execute: jest.fn(async () => ({ monthlyData: [] })),
  })),
}));

jest.mock("@/server/usecases/get-balance-sheet-usecase", () => ({
  GetBalanceSheetUsecase: jest.fn().mockImplementation(() => ({
    execute: jest.fn(async () => ({ balanceSheetData: {} })),
  })),
}));

describe("loadTopPageData", () => {
  test("returns friendly and political sankey data", async () => {
    const { loadTopPageData } = await import("@/server/loaders/load-top-page-data");
    const data = await loadTopPageData({ slugs: ["org"], page: 1, perPage: 6, financialYear: 2025 });
    expect(data.political).toBeDefined();
    expect(data.friendly).toBeDefined();
    // ensure sankey usecase was called twice with different categoryType
    const types = sankeyExec.mock.calls.map((c: any[]) => c[0].categoryType).filter(Boolean);
    expect(types).toEqual(expect.arrayContaining(["political-category", "friendly-category"]));
  });
});

