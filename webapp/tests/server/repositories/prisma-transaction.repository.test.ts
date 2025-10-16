// Mock the category-mapping module
jest.mock("@/shared/utils/category-mapping", () => ({
  // Provide empty PL_CATEGORIES so fallback path works during tests
  PL_CATEGORIES: {},
  BS_CATEGORIES: {
    未払費用: { type: "liability", category: "負債" },
    借入金: { type: "liability", category: "負債" },
    現金: { type: "asset", category: "資産" },
  },
}));

import { PrismaTransactionRepository } from "../../../src/server/repositories/prisma-transaction.repository";

// Prisma クライアントのモック
const mockPrisma = {
  transaction: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe("PrismaTransactionRepository", () => {
  let repository: PrismaTransactionRepository;

  beforeEach(() => {
    repository = new PrismaTransactionRepository(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe("getLiabilityBalance", () => {
    const testPoliticalOrganizationIds = ["1", "2"];
    const testFinancialYear = 2024;

    it("should calculate liability balance correctly", async () => {
      // 借方（負債の減少）: 50000
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({
          _sum: { debitAmount: BigInt(50000) },
        })
        // 貸方（負債の増加）: 100000
        .mockResolvedValueOnce({
          _sum: { creditAmount: BigInt(100000) },
        });

      const result = await repository.getLiabilityBalance(
        testPoliticalOrganizationIds,
        testFinancialYear
      );

      // 負債残高 = 貸方 - 借方 = 100000 - 50000 = 50000
      expect(result).toEqual(50000);

      // 2回呼び出される（借方用と貸方用）
      expect(mockPrisma.transaction.aggregate).toHaveBeenCalledTimes(2);

      // 借方集計のクエリを検証
      expect(mockPrisma.transaction.aggregate).toHaveBeenNthCalledWith(1, {
        _sum: { debitAmount: true },
        where: {
          politicalOrganizationId: {
            in: [BigInt("1"), BigInt("2")],
          },
          financialYear: testFinancialYear,
          debitAccount: {
            in: ["未払費用", "借入金"],
          },
        },
      });

      // 貸方集計のクエリを検証
      expect(mockPrisma.transaction.aggregate).toHaveBeenNthCalledWith(2, {
        _sum: { creditAmount: true },
        where: {
          politicalOrganizationId: {
            in: [BigInt("1"), BigInt("2")],
          },
          financialYear: testFinancialYear,
          creditAccount: {
            in: ["未払費用", "借入金"],
          },
        },
      });
    });

    it("should handle null values in aggregate results", async () => {
      // null値のケース
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({
          _sum: { debitAmount: null },
        })
        .mockResolvedValueOnce({
          _sum: { creditAmount: null },
        });

      const result = await repository.getLiabilityBalance(
        testPoliticalOrganizationIds,
        testFinancialYear
      );

      expect(result).toEqual(0);
    });

    it("should handle negative liability balance", async () => {
      // 借方が貸方より大きい場合（負債がマイナス）
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({
          _sum: { debitAmount: BigInt(100000) },
        })
        .mockResolvedValueOnce({
          _sum: { creditAmount: BigInt(50000) },
        });

      const result = await repository.getLiabilityBalance(
        testPoliticalOrganizationIds,
        testFinancialYear
      );

      // 負債残高 = 貸方 - 借方 = 50000 - 100000 = -50000
      expect(result).toEqual(-50000);
    });

  });

  describe("findWithPagination category filter & sorting", () => {
    it("applies category_keys filter and amount sorting", async () => {
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);
      mockPrisma.transaction.count.mockResolvedValueOnce(0);

      await repository.findWithPagination(
        { category_keys: ["house.food", "income.salary"] } as any,
        { page: 1, perPage: 50, sortBy: "amount", order: "asc" },
      );

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledTimes(1);
      const args = mockPrisma.transaction.findMany.mock.calls[0][0];
      expect(args.where.categoryKey).toEqual({ in: ["house.food", "income.salary"] });
      // amount sorting uses debitAmount internally
      expect(args.orderBy).toEqual({ debitAmount: "asc" });
    });

    it("defaults to date desc when sort not specified", async () => {
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);
      mockPrisma.transaction.count.mockResolvedValueOnce(0);

      await repository.findWithPagination({}, { page: 1, perPage: 50 });

      const args = mockPrisma.transaction.findMany.mock.calls[0][0];
      expect(args.orderBy).toEqual({ transactionDate: "desc" });
    });
  });

  describe("getCategoryAggregationForSankey fallback mapping", () => {
    it("falls back to account name when PL mapping is missing (political-category)", async () => {
      // 1st groupBy call: income (creditAccount)
      mockPrisma.transaction.groupBy
        .mockResolvedValueOnce([
          { creditAccount: "未知勘定A", _sum: { creditAmount: BigInt(1200) } },
        ])
        // 2nd groupBy call: expense (debitAccount)
        .mockResolvedValueOnce([
          { debitAccount: "未知費目B", _sum: { debitAmount: BigInt(800) } },
        ]);

      const result = await repository.getCategoryAggregationForSankey(
        ["1"],
        2025,
        // default political-category path
      );

      expect(result.income).toEqual(
        expect.arrayContaining([
          { category: "未知勘定A", subcategory: undefined, totalAmount: 1200 },
        ]),
      );
      expect(result.expense).toEqual(
        expect.arrayContaining([
          { category: "未知費目B", subcategory: undefined, totalAmount: 800 },
        ]),
      );
    });

    it("uses tag as subcategory and falls back category to account when mapping is missing (friendly-category)", async () => {
      // 1st groupBy call: income with tag (creditAccount, friendlyCategory)
      mockPrisma.transaction.groupBy
        .mockResolvedValueOnce([
          {
            creditAccount: "未知収入",
            friendlyCategory: "タグX",
            _sum: { creditAmount: BigInt(500) },
          },
        ])
        // 2nd groupBy call: expense with tag (debitAccount, friendlyCategory)
        .mockResolvedValueOnce([
          {
            debitAccount: "未知支出",
            friendlyCategory: "タグY",
            _sum: { debitAmount: BigInt(300) },
          },
        ]);

      const result = await repository.getCategoryAggregationForSankey(
        ["1"],
        2025,
        "friendly-category",
      );

      expect(result.income).toEqual(
        expect.arrayContaining([
          { category: "未知収入", subcategory: "タグX", totalAmount: 500 },
        ]),
      );
      expect(result.expense).toEqual(
        expect.arrayContaining([
          { category: "未知支出", subcategory: "タグY", totalAmount: 300 },
        ]),
      );
    });
  });
});
