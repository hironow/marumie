// Mock Next.js cache to avoid incremental cache requirement in test env
jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

let loadTransactionsPageData: any;

const executeMock = jest.fn(async (params: any) => ({
  transactions: [],
  total: 0,
  page: params.page,
  perPage: params.perPage,
  totalPages: 0,
  politicalOrganizations: [{ slug: params.slugs[0], displayName: "Org" }],
  lastUpdatedAt: new Date("2025-10-01T00:00:00Z"),
}));

jest.mock("@/server/usecases/get-transactions-by-slug-usecase", () => {
  return {
    GetTransactionsBySlugUsecase: jest.fn().mockImplementation(() => ({
      execute: executeMock,
    })),
  };
});

describe("loadTransactionsPageData", () => {
  beforeAll(async () => {
    ({ loadTransactionsPageData } = await import(
      "@/server/loaders/load-transactions-page-data"
    ));
  });
  beforeEach(() => executeMock.mockClear());

  test("passes params through and returns shape", async () => {
    const params = {
      slugs: ["household-sample"],
      page: 2,
      perPage: 50,
      transactionType: "expense" as const,
      financialYear: 2025,
      sortBy: "amount" as const,
      order: "asc" as const,
      categories: ["house.food"],
    };
    const data = await loadTransactionsPageData(params);
    expect(executeMock).toHaveBeenCalledWith(params);
    expect(data.page).toBe(2);
    expect(data.perPage).toBe(50);
    expect(data.total).toBe(0);
    expect(Array.isArray(data.transactions)).toBe(true);
    expect(Array.isArray(data.politicalOrganizations)).toBe(true);
    expect(typeof data.lastUpdatedAt).toBe("object");
  });

  test("supports sortBy=date and order=desc", async () => {
    const params = {
      slugs: ["household-sample"],
      page: 1,
      perPage: 50,
      transactionType: undefined,
      financialYear: 2025,
      sortBy: "date" as const,
      order: "desc" as const,
    };
    await loadTransactionsPageData(params);
    expect(executeMock).toHaveBeenCalledWith(params);
  });

  test("supports categories filter with multiple keys", async () => {
    const params = {
      slugs: ["household-sample"],
      page: 3,
      perPage: 50,
      transactionType: "income" as const,
      financialYear: 2025,
      sortBy: "amount" as const,
      order: "desc" as const,
      categories: ["house.food", "house.utilities", "income.salary"],
    };
    await loadTransactionsPageData(params);
    expect(executeMock).toHaveBeenCalledWith(params);
  });

  test("omits optional params when undefined", async () => {
    const params = {
      slugs: ["org"],
      page: 1,
      perPage: 50,
      financialYear: 2025,
    } as any;
    await loadTransactionsPageData(params);
    const called = executeMock.mock.calls.at(-1)?.[0];
    expect(called.sortBy).toBeUndefined();
    expect(called.order).toBeUndefined();
    expect(called.categories).toBeUndefined();
  });
});
