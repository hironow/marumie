import { downloadTransactionsCsv } from "@/server/actions/download-transactions-csv";

jest.mock("@/server/loaders/load-transactions-for-csv", () => ({
  loadTransactionsForCsv: jest.fn(async () => ({
    transactions: [
      {
        transaction_date: new Date("2025-10-01T00:00:00Z"),
        political_organization_name: "家庭\"サンプル\"",
        transaction_type: "expense",
        debit_amount: 1500,
        credit_amount: 0,
        debit_account: "食費",
        credit_account: "普通預金",
        friendly_category: "食費",
        label: "",
      },
      {
        transaction_date: new Date("2025-10-02T00:00:00Z"),
        political_organization_name: "Household Sample",
        transaction_type: "income",
        debit_amount: 0,
        credit_amount: 100000,
        debit_account: "普通預金",
        credit_account: "勤務収入",
        friendly_category: "勤務収入",
        label: "給与",
      },
      // special chars in fields (commas, quotes, newline)
      {
        transaction_date: new Date("2025-10-04T00:00:00Z"),
        political_organization_name: 'Org, "Quoted"',
        transaction_type: "income",
        debit_amount: 0,
        credit_amount: 12345,
        debit_account: "普通預金",
        credit_account: '勤務,収入"特別"',
        friendly_category: '家計,\n特別',
        label: 'メモ,"改行\n含む"',
      },
      // row with empty friendly_category and empty label
      {
        transaction_date: new Date("2025-10-03T00:00:00Z"),
        political_organization_name: "Household Sample",
        transaction_type: "expense",
        debit_amount: 3000,
        credit_amount: 0,
        debit_account: "日用品",
        credit_account: "普通預金",
        friendly_category: "",
        label: "",
      },
    ],
  })),
}));

describe("downloadTransactionsCsv", () => {
  test("returns CSV content with proper headers and escaping", async () => {
    const result = await downloadTransactionsCsv("household-sample");
    expect(result.success).toBe(true);
    if (!result.success) return;
    const lines = result.data.split("\n");
    expect(lines[0]).toBe("日付,政治団体名,タイプ,金額,カテゴリ,詳細区分,ラベル");
    // first row: expense, uses debit side and quotes escaped
    expect(lines[1]).toContain("2025-10-01");
    expect(lines[1]).toContain("\"家庭\"\"サンプル\"\"");
    expect(lines[1]).toContain(",支出,");
    expect(lines[1]).toContain(",1500,");
    expect(lines[1]).toContain("\"食費\"");
    // second row: income, uses credit side and label present
    expect(lines[2]).toContain("2025-10-02");
    expect(lines[2]).toContain(",収入,");
    expect(lines[2]).toContain(",100000,");
    expect(lines[2]).toContain("\"勤務収入\"");
    expect(lines[2]).toContain("\"給与\"");
    // row with empty friendly_category and label are quoted empty strings
    const emptyIdx = lines.findIndex(l => l.includes("2025-10-03"));
    expect(emptyIdx).toBeGreaterThan(0);
    expect(lines[emptyIdx].endsWith('\"\"')).toBe(true);

    // row with special characters properly quoted/escaped
    // Special row contains commas, quotes and newline; verify in full blob to avoid naive line-splitting issues
    expect(result.data).toContain('2025-10-04');
    expect(result.data).toContain('"Org, ""Quoted"""');
    expect(result.data).toContain('"勤務,収入""特別"""');
    expect(result.data).toContain('"家計,'); // contains comma/newline implies quoted field
    expect(result.data).toContain('"メモ,""改行');

    // filename suffix
    expect(result.filename.startsWith("transactions_household-sample_")).toBe(
      true,
    );
  });
});
