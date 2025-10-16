import { HouseholdRecordConverter } from "@/server/lib/household-record-converter";

describe("HouseholdRecordConverter", () => {
  const converter = new HouseholdRecordConverter();

  test("expense when debit is 食費 and credit is 普通預金", () => {
    const tx = converter.convertRow(
      {
        transaction_no: "1",
        transaction_date: "2025-10-01",
        debit_account: "食費",
        debit_amount: "1500",
        credit_account: "普通預金",
        credit_amount: "1500",
        description: "スーパー",
      },
      "1",
    );

    expect(tx.transaction_type).toBe("expense");
    expect(tx.category_key).toBe("house.food");
    expect(tx.friendly_category).toBe("食費");
    expect(typeof tx.hash).toBe("string");
    expect(tx.hash.length).toBeGreaterThan(0);
  });

  test("income when debit is 普通預金 and credit is 勤務収入", () => {
    const tx = converter.convertRow(
      {
        transaction_no: "2",
        transaction_date: "2025-10-01",
        debit_account: "普通預金",
        debit_amount: "100000",
        credit_account: "勤務収入",
        credit_amount: "100000",
        description: "給与",
      },
      "1",
    );

    expect(tx.transaction_type).toBe("income");
    expect(tx.category_key.startsWith("income.")).toBe(true);
  });
});

