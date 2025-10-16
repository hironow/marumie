import { GetTransactionsBySlugUsecase } from "@/server/usecases/get-transactions-by-slug-usecase";

describe("GetTransactionsBySlugUsecase", () => {
  function createMocks(total: number = 0) {
    const txRepo = {
      findWithPagination: jest.fn(async (_filters: any, pagination: any) => ({
        items: [],
        total,
        page: pagination.page,
        perPage: pagination.perPage,
        totalPages: Math.ceil(total / pagination.perPage),
      })),
      getLastUpdatedAt: jest.fn(async () => new Date("2025-10-01T00:00:00Z")),
    } as any;

    const polRepo = {
      findBySlugs: jest.fn(async (_slugs: string[]) => [
        { id: "1", slug: "org", displayName: "Org", orgName: null, description: null, createdAt: new Date(), updatedAt: new Date() },
      ]),
    } as any;

    return { txRepo, polRepo };
  }

  test("clamps page/perPage and computes totalPages", async () => {
    const { txRepo, polRepo } = createMocks(125);
    const usecase = new GetTransactionsBySlugUsecase(txRepo, polRepo);
    const result = await usecase.execute({
      slugs: ["org"],
      page: 0,
      perPage: 500,
      financialYear: 2025,
    });
    // page is clamped to 1, perPage clamped to 100
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(100);
    // totalPages = ceil(125/100) = 2
    expect(result.totalPages).toBe(2);
    // repository called with clamped pagination
    const pagination = txRepo.findWithPagination.mock.calls.at(-1)?.[1];
    expect(pagination.page).toBe(1);
    expect(pagination.perPage).toBe(100);
  });

  test("passes sorting and categories to repository", async () => {
    const { txRepo, polRepo } = createMocks(10);
    const usecase = new GetTransactionsBySlugUsecase(txRepo, polRepo);
    await usecase.execute({
      slugs: ["org"],
      page: 2,
      perPage: 50,
      financialYear: 2025,
      sortBy: "amount",
      order: "desc",
      categories: ["house.food", "income.salary"],
    });
    const [filters, pagination] = txRepo.findWithPagination.mock.calls.at(-1);
    expect(pagination.sortBy).toBe("amount");
    expect(pagination.order).toBe("desc");
    expect(filters.category_keys).toEqual(["house.food", "income.salary"]);
  });

  test("omits category_keys when categories is empty array", async () => {
    const { txRepo, polRepo } = createMocks(10);
    const usecase = new GetTransactionsBySlugUsecase(txRepo, polRepo);
    await usecase.execute({
      slugs: ["org"],
      page: 1,
      perPage: 50,
      financialYear: 2025,
      categories: [],
    });
    const [filters] = txRepo.findWithPagination.mock.calls.at(-1);
    expect(filters.category_keys).toBeUndefined();
  });

  test("throws when organizations not found", async () => {
    const { txRepo } = createMocks();
    const polRepo = { findBySlugs: jest.fn(async () => []) } as any;
    const usecase = new GetTransactionsBySlugUsecase(txRepo, polRepo);
    await expect(
      usecase.execute({ slugs: ["missing"], page: 1, perPage: 50, financialYear: 2025 }),
    ).rejects.toThrow(/not found/);
  });

  test("returns zero totalPages when total is 0", async () => {
    const { txRepo, polRepo } = createMocks(0);
    const usecase = new GetTransactionsBySlugUsecase(txRepo, polRepo);
    const result = await usecase.execute({ slugs: ["org"], page: 1, perPage: 50, financialYear: 2025 });
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  test("computes totalPages correctly for large totals", async () => {
    const { txRepo, polRepo } = createMocks(123);
    const usecase = new GetTransactionsBySlugUsecase(txRepo, polRepo);
    const result = await usecase.execute({ slugs: ["org"], page: 5, perPage: 50, financialYear: 2025 });
    // 123 / 50 -> 3 pages
    expect(result.totalPages).toBe(3);
    // page value is passed through
    expect(result.page).toBe(5);
  });
});
