import { convertCategoryAggregationToSankeyData } from "@/server/utils/sankey-category-converter";

describe("Sankey converter boundaries", () => {
  test("adds (仕訳中) when income > expense and adds 現金残高 (political)", () => {
    const aggregation = {
      income: [{ category: "寄附", totalAmount: 100 }],
      expense: [{ category: "経常経費", totalAmount: 50 }],
    };
    const data = convertCategoryAggregationToSankeyData(
      aggregation,
      false, // isFriendlyCategory
      20, // currentYearBalance
      0, // previousYearBalance
      0, // liabilityBalance
    );

    const nodeLabels = data.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("(仕訳中)");
    expect(nodeLabels).toContain("現金残高");
  });

  test("splits 現金残高 into 未払費用 and 収支 when friendly", () => {
    const aggregation = {
      income: [{ category: "寄附", totalAmount: 100 }],
      expense: [{ category: "経常経費", totalAmount: 50 }],
    };
    const data = convertCategoryAggregationToSankeyData(
      aggregation,
      true, // friendly
      70, // currentYearBalance
      0,
      30, // liability -> 未払費用 30, 収支 40
    );
    const nodes = data.nodes.map((n) => `${n.nodeType}:${n.label}`);
    // expense-sub nodes should contain both categories under 現金残高
    expect(nodes).toContain("expense-sub:未払費用");
    expect(nodes).toContain("expense-sub:収支");
  });
});

