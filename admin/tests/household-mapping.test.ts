import { HOUSEHOLD_PL_CATEGORIES, HOUSEHOLD_BS_CATEGORIES, HOUSEHOLD_CASH_ACCOUNTS } from "@/shared/utils/category-mapping.household";

describe("household category mapping", () => {
  test("should map 食費 as expense", () => {
    const m = HOUSEHOLD_PL_CATEGORIES["食費"];
    expect(m).toBeTruthy();
    expect(m.type).toBe("expense");
    expect(m.key).toBe("house.food");
  });

  test("should map 勤務収入 as income", () => {
    const m = HOUSEHOLD_PL_CATEGORIES["勤務収入"];
    expect(m).toBeTruthy();
    expect(m.type).toBe("income");
  });

  test("should mark クレジットカード as liability BS category", () => {
    expect(HOUSEHOLD_BS_CATEGORIES["クレジットカード"]).toBeTruthy();
    expect(HOUSEHOLD_BS_CATEGORIES["クレジットカード"].type).toBe("liability");
  });

  test("cash accounts should include 現金 and 普通預金", () => {
    expect(HOUSEHOLD_CASH_ACCOUNTS.has("現金")).toBe(true);
    expect(HOUSEHOLD_CASH_ACCOUNTS.has("普通預金")).toBe(true);
  });
});

