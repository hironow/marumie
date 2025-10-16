import { convertCategoryAggregationToSankeyData } from "@/server/utils/sankey-category-converter";
import type { SankeyCategoryAggregationResult } from "@/server/repositories/interfaces/transaction-repository.interface";

describe("Sankey friendly-category consolidation (income side)", () => {
  test("consolidates many small income subcategories into 'その他（寄附）'", () => {
    const smalls = Array.from({ length: 12 }).map((_, i) => ({ category: "寄附", subcategory: `小口寄附${i + 1}`, totalAmount: 4 }));
    const aggregation: SankeyCategoryAggregationResult = {
      income: [
        { category: "寄附", subcategory: "個人からの寄附", totalAmount: 400 },
        ...smalls,
      ],
      expense: [ { category: "政治活動費", subcategory: "宣伝費", totalAmount: 200 } ],
    };

    const result = convertCategoryAggregationToSankeyData(aggregation, true, 0, 0, 0);
    const labels = result.nodes.map((n) => n.label);
    expect(labels).toContain("その他（寄附）");

    const consolidatedNode = result.nodes.find((n) => n.label === "その他（寄附）");
    const linkToCategory = result.links.find((l) => l.source === consolidatedNode?.id);
    // 12 * 4 = 48 が閾値により統合された分として加算される（下限）
    expect(linkToCategory?.value).toBeGreaterThanOrEqual(48);
  });
});
