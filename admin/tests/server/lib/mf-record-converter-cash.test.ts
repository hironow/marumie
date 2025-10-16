import { MfRecordConverter } from "@/server/lib/mf-record-converter";
import type { MfCsvRecord } from "@/server/lib/mf-csv-loader";

describe("MfRecordConverter with cash-equivalent BS accounts", () => {
  const converter = new MfRecordConverter();

  function baseRecord(): MfCsvRecord {
    return {
      transaction_no: "1",
      transaction_date: "2025-10-01",
      debit_account: "",
      debit_sub_account: "",
      debit_department: "",
      debit_partner: "",
      debit_tax_category: "",
      debit_invoice: "",
      debit_amount: "0",
      credit_account: "",
      credit_sub_account: "",
      credit_department: "",
      credit_partner: "",
      credit_tax_category: "",
      credit_invoice: "",
      credit_amount: "0",
      description: "",
      friendly_category: "",
      memo: "",
    };
  }

  test("income when debit is 現金 and credit is PL", () => {
    const rec = baseRecord();
    rec.debit_account = "現金"; // cash-equivalent
    rec.debit_amount = "1000";
    rec.credit_account = "機関紙誌の発行その他の事業による収入"; // PL category (income)
    rec.credit_amount = "1000";

    const tx = converter.convertRow(rec, "1");
    expect(tx.transaction_type).toBe("income");
  });

  test("expense when credit is 当座預金 and debit is PL", () => {
    const rec = baseRecord();
    rec.debit_account = "人件費"; // PL category (expense)
    rec.debit_amount = "2000";
    rec.credit_account = "当座預金"; // cash-equivalent
    rec.credit_amount = "2000";

    const tx = converter.convertRow(rec, "1");
    expect(tx.transaction_type).toBe("expense");
  });

  test("income when debit is 定期預金 and credit is PL", () => {
    const rec = baseRecord();
    rec.debit_account = "定期預金"; // cash-equivalent
    rec.debit_amount = "5000";
    rec.credit_account = "その他の収入"; // PL category (income)
    rec.credit_amount = "5000";

    const tx = converter.convertRow(rec, "1");
    expect(tx.transaction_type).toBe("income");
  });
});

