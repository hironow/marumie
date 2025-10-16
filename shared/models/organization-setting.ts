export type OrgType = "political" | "household" | "personal";

export interface OrganizationSetting {
  id: string;
  political_organization_id: string;
  org_type: OrgType;
  mapping_profile: string | null;
  features: unknown | null; // JSON
  created_at: Date;
  updated_at: Date;
}

