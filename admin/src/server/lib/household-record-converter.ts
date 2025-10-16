import type { HouseholdCsvRecord } from "./household-csv-loader";
import {
  HOUSEHOLD_PL_CATEGORIES,
  HOUSEHOLD_BS_CATEGORIES,
  HOUSEHOLD_CASH_ACCOUNTS,
} from "@/shared/utils/category-mapping.household";
import type { TransactionType } from "@/shared/models/transaction";
import { generateTransactionHash } from "./transaction-hash";

export interface PreviewHouseholdTransaction {
  political_organization_id: string;
  transaction_no: string;
  transaction_date: Date;
  transaction_type: TransactionType | null;
  debit_account: string;
  debit_sub_account?: string;
  debit_amount: number;
  credit_account: string;
  credit_sub_account?: string;
  credit_amount: number;
  description?: string;
  label?: string;
  friendly_category: string;
  category_key: string;
  hash: string;
  status: "insert" | "update" | "invalid" | "skip";
  errors: string[];
}

export class HouseholdRecordConverter {
  convertRow(
    record: HouseholdCsvRecord,
    politicalOrganizationId: string,
  ): PreviewHouseholdTransaction {
    const debitAmount = this.parseAmount(record.debit_amount);
    const creditAmount = this.parseAmount(record.credit_amount);

    const categoryKey = this.determineCategoryKey(
      record.debit_account,
      record.credit_account,
    );
    const transactionType = this.determineTransactionType(
      record.debit_account,
      record.credit_account,
    );

    const friendlyCategory = this.determineFriendlyCategory(
      record.debit_account,
      record.credit_account,
    );

    const { date: transactionDate, isValid } = this.parseTransactionDate(
      record.transaction_date,
    );

    let status: PreviewHouseholdTransaction["status"] = "insert";
    const errors: string[] = [];

    if (transactionType === null) {
      status = "invalid";
      errors.push(
        `Invalid account combination: debit=${record.debit_account}, credit=${record.credit_account}`,
      );
    }
    if (!isValid) {
      status = "invalid";
      errors.push(`Invalid date format: ${record.transaction_date}`);
    }

    const tx: PreviewHouseholdTransaction = {
      political_organization_id: politicalOrganizationId,
      transaction_no: record.transaction_no,
      transaction_date: transactionDate,
      transaction_type: transactionType,
      debit_account: record.debit_account,
      debit_sub_account: record.debit_sub_account,
      debit_amount: debitAmount,
      credit_account: record.credit_account,
      credit_sub_account: record.credit_sub_account,
      credit_amount: creditAmount,
      description: record.description,
      label: undefined,
      friendly_category: friendlyCategory,
      category_key: categoryKey,
      hash: "",
      status,
      errors,
    };

    tx.hash = generateTransactionHash(tx as any);
    return tx;
  }

  private parseTransactionDate(dateStr: string): {
    date: Date;
    isValid: boolean;
  } {
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime()))
        return { date: new Date("1970-01-01"), isValid: false };
      return { date, isValid: true };
    } catch {
      return { date: new Date("1970-01-01"), isValid: false };
    }
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr || amountStr.trim() === "") return 0;
    const cleaned = amountStr.replace(/[\,\s]/g, "");
    const parsed = parseInt(cleaned, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private determineCategoryKey(
    debitAccount: string,
    creditAccount: string,
  ): string {
    if (HOUSEHOLD_PL_CATEGORIES[debitAccount]) {
      return HOUSEHOLD_PL_CATEGORIES[debitAccount].key;
    }
    if (HOUSEHOLD_PL_CATEGORIES[creditAccount]) {
      return HOUSEHOLD_PL_CATEGORIES[creditAccount].key;
    }
    return "house.undefined";
  }

  private determineFriendlyCategory(
    debitAccount: string,
    creditAccount: string,
  ): string {
    if (HOUSEHOLD_PL_CATEGORIES[debitAccount]) return debitAccount;
    if (HOUSEHOLD_PL_CATEGORIES[creditAccount]) return creditAccount;
    return "";
  }

  private isCashEquivalent(account: string): boolean {
    return HOUSEHOLD_CASH_ACCOUNTS.has(account);
  }

  private determineTransactionType(
    debitAccount: string,
    creditAccount: string,
  ): TransactionType | null {
    const isDebitPL = Boolean(HOUSEHOLD_PL_CATEGORIES[debitAccount]);
    const isCreditPL = Boolean(HOUSEHOLD_PL_CATEGORIES[creditAccount]);
    const isDebitBS = Boolean(HOUSEHOLD_BS_CATEGORIES[debitAccount]);
    const isCreditBS = Boolean(HOUSEHOLD_BS_CATEGORIES[creditAccount]);

    // 現金収入: BS(借方)が現金類 + PL(貸方)
    if (isDebitBS && this.isCashEquivalent(debitAccount) && isCreditPL)
      return "income";
    // 現金支出: PL(借方) + BS(貸方)が現金類
    if (isDebitPL && isCreditBS && this.isCashEquivalent(creditAccount))
      return "expense";
    // 非現金仕訳: BSとPLの組み合わせで現金を含まない
    if ((isDebitPL && isCreditBS) || (isDebitBS && isCreditPL))
      return "non_cash_journal";
    return null;
  }
}
