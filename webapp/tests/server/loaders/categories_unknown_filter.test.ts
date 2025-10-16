// Mock Next.js cache
jest.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

let loadTransactionsPageData: any;

const executeMock = jest.fn(async (params: any) => ({
  transactions: [],
  total: 0,
  page: params.page,
  perPage: params.perPage,
  totalPages: 0,
  politicalOrganizations: [{ slug: params.slugs[0], displayName: "Org" }],
  lastUpdatedAt: new Date("2025-10-01T00:00:00Z").toISOString(),
}));

jest.mock("@/server/usecases/get-transactions-by-slug-usecase", () => ({
  GetTransactionsBySlugUsecase: jest.fn().mockImplementation(() => ({ execute: executeMock })),
}));

describe("categories unknown keys are passed through", () => {
  beforeAll(async () => {
    ({ loadTransactionsPageData } = await import("@/server/loaders/load-transactions-page-data"));
  });
  beforeEach(() => executeMock.mockClear());

  test("passes unknown categories unchanged to usecase", async () => {
    const params = {
      slugs: ["org"],
      page: 1,
      perPage: 50,
      financialYear: 2025,
      categories: ["unknown.category", "house.food", "misc.custom"],
    } as any;
    await loadTransactionsPageData(params);
    const called = executeMock.mock.calls.at(-1)?.[0];
    expect(called.categories).toEqual(["unknown.category", "house.food", "misc.custom"]);
  });
});

