export interface Customer {
  id: number;
  company_name: string;
  tin: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  customer_type: "Company" | "Individual";
  business_type: string;
  credit_terms: string;
  notes: string;
  is_active: boolean;
  preferred_port: number | null;
  preferred_port_name: string | null;
  currency_preference: number | null;
  currency_preference_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

export interface CustomerFilters {
  search?: string;
  company_name?: string;
  tin?: string;
  business_type?: string;
  customer_type?: string;
  credit_terms?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface TinCheckResponse {
  duplicate: boolean;
  existing_customer: { id: number; company_name: string } | null;
}
