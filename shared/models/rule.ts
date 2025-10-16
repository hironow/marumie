export interface Rule {
  id: string;
  political_organization_id: string;
  field: string; // description | label | etc.
  operator: string; // contains | regex
  pattern: string;
  action: string; // e.g. set:categoryKey=house.food
  priority: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

