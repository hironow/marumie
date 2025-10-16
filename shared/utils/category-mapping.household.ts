import type { CategoryMapping } from "./category-mapping";

// 家計向けの表示用カテゴリマッピング
// キーはCSVやインポート後の勘定（または分類）名を想定
export const HOUSEHOLD_PL_CATEGORIES: Record<string, CategoryMapping> = {
  // 収入
  勤務収入: {
    key: "income.salary",
    category: "収入",
    shortLabel: "給与",
    color: "#60A5FA",
    type: "income",
  },
  賞与: {
    key: "income.bonus",
    category: "収入",
    shortLabel: "賞与",
    color: "#93C5FD",
    type: "income",
  },
  副業収入: {
    key: "income.side",
    category: "収入",
    shortLabel: "副業",
    color: "#7DD3FC",
    type: "income",
  },
  配当収入: {
    key: "income.dividend",
    category: "収入",
    shortLabel: "配当",
    color: "#34D399",
    type: "income",
  },

  // 支出（固定費）
  家賃: {
    key: "house.rent",
    category: "固定費",
    shortLabel: "家賃",
    color: "#FCA5A5",
    type: "expense",
  },
  住宅ローン: {
    key: "house.loan",
    category: "固定費",
    shortLabel: "住宅ローン",
    color: "#F87171",
    type: "expense",
  },
  水道光熱費: {
    key: "house.utilities",
    category: "固定費",
    shortLabel: "水道光熱",
    color: "#FDE68A",
    type: "expense",
  },
  通信費: {
    key: "house.communication",
    category: "固定費",
    shortLabel: "通信",
    color: "#A78BFA",
    type: "expense",
  },
  保険料: {
    key: "house.insurance",
    category: "固定費",
    shortLabel: "保険",
    color: "#C4B5FD",
    type: "expense",
  },
  税金: {
    key: "house.tax",
    category: "固定費",
    shortLabel: "税金",
    color: "#FDA4AF",
    type: "expense",
  },

  // 支出（変動費）
  食費: {
    key: "house.food",
    category: "変動費",
    shortLabel: "食費",
    color: "#FBBF24",
    type: "expense",
  },
  交通費: {
    key: "house.transport",
    category: "変動費",
    shortLabel: "交通",
    color: "#34D399",
    type: "expense",
  },
  日用品: {
    key: "house.daily",
    category: "変動費",
    shortLabel: "日用品",
    color: "#86EFAC",
    type: "expense",
  },
  娯楽: {
    key: "house.entertainment",
    category: "変動費",
    shortLabel: "娯楽",
    color: "#F472B6",
    type: "expense",
  },
  教養教育: {
    key: "house.education",
    category: "変動費",
    shortLabel: "教養教育",
    color: "#60A5FA",
    type: "expense",
  },
  医療費: {
    key: "house.medical",
    category: "変動費",
    shortLabel: "医療",
    color: "#FCA5A5",
    type: "expense",
  },
  交際費: {
    key: "house.social",
    category: "変動費",
    shortLabel: "交際",
    color: "#A7F3D0",
    type: "expense",
  },
  子ども費: {
    key: "house.children",
    category: "変動費",
    shortLabel: "子ども",
    color: "#F9A8D4",
    type: "expense",
  },
  その他: {
    key: "house.other",
    category: "変動費",
    shortLabel: "その他",
    color: "#E5E7EB",
    type: "expense",
  },
};

// 家計の貸借科目の分類（シンプル版）
export const HOUSEHOLD_BS_CATEGORIES: Record<string, { type: "asset" | "liability" | "net_asset" }> = {
  現金: { type: "asset" },
  普通預金: { type: "asset" },
  貯蓄預金: { type: "asset" },
  証券口座: { type: "asset" },
  クレジットカード: { type: "liability" },
  ローン: { type: "liability" },
};

export const HOUSEHOLD_CASH_ACCOUNTS = new Set(["現金", "普通預金", "貯蓄預金"]);

