export interface AppUser {
  id: string;
  organization_id: string;
  azure_object_id: string;
  email: string;
  display_name: string | null;
  role: 'employee' | 'manager' | 'admin';
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}
