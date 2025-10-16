export type AccountType =
  | "bank"
  | "cash"
  | "credit_card"
  | "e_money"
  | "investment"
  | "loan";

export interface Account {
  id: string;
  political_organization_id: string;
  name: string;
  type: AccountType;
  institution?: string | null;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

