export type HouseholdRole = "owner" | "admin" | "member" | "viewer";

export interface HouseholdMember {
  id: string;
  political_organization_id: string;
  user_id: string;
  name: string;
  role: HouseholdRole;
  created_at: Date;
  updated_at: Date;
}

