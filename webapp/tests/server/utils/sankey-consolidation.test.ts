import { convertCategoryAggregationToSankeyData } from "@/server/utils/sankey-category-converter";
import type { SankeyCategoryAggregationResult } from "@/server/repositories/interfaces/transaction-repository.interface";

describe("Sankey friendly-category consolidation (その他) threshold", () => {
  test("consolidates many small subcategories into 'その他（政治活動費）'", () => {
    const smalls = Array.from({ length: 12 }).map((_, i) => ({ category: "政治活動費", subcategory: `小目${i + 1}`, totalAmount: 10 }));
    const larges = [
      { category: "政治活動費", subcategory: "宣伝費", totalAmount: 500 },
      { category: "政治活動費", subcategory: "組織活動費", totalAmount: 400 },
    ];
    const aggregation: SankeyCategoryAggregationResult = {
      income: [ { category: "寄附", subcategory: "個人からの寄附", totalAmount: 2000 } ],
      expense: [ ...larges, ...smalls ],
    };

    const result = convertCategoryAggregationToSankeyData(aggregation, true, 0, 0, 0);
    const labels = result.nodes.map((n) => n.label);
    // Consolidated node should exist
    expect(labels).toContain("その他（政治活動費）");
    // Consolidated value equals sum of smalls (12 * 10 = 120)
    const expenseLinks = result.links.filter((l) => result.nodes.find(n => n.id === l.source)?.label === "政治活動費");
    const consolidated = result.nodes.find((n) => n.label === "その他（政治活動費）");
    const linkToConsolidated = result.links.find((l) => l.target === consolidated?.id);
    expect(linkToConsolidated?.value).toBeGreaterThanOrEqual(120);
  });
});

