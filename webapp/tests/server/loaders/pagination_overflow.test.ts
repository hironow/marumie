// Mock Next.js cache to avoid incremental cache requirement
jest.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

let loadTransactionsPageData: any;

const executeMock = jest.fn(async (params: any) => ({
  transactions: [],
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

describe("loadTransactionsPageData pagination overflow", () => {
  beforeAll(async () => {
    ({ loadTransactionsPageData } = await import("@/server/loaders/load-transactions-page-data"));
  });
  beforeEach(() => executeMock.mockClear());

  test("does not clamp page beyond totalPages (documents current behavior)", async () => {
    const params: any = {
      slugs: ["org"],
      page: 5, // request beyond total pages
      perPage: 50,
      financialYear: 2025,
      __total: 120, // totalPages = 3
    };
    const data = await loadTransactionsPageData(params);
    expect(data.totalPages).toBe(3);
    // current behavior: page value is passed through
    expect(data.page).toBe(5);
  });
});

