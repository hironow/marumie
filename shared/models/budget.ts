export interface Budget {
  id: string;
  political_organization_id: string;
  year_month: string; // YYYY-MM
  category_key: string;
  amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface UpsertBudgetInput {
  political_organization_id: string;
  year_month: string;
  category_key: string;
  amount: number;
}

