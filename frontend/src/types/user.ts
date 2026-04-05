export interface UserRole {
  id: number;
  name: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole | null;
  phone: string;
  department: string;
  is_active: boolean;
  is_force_password_change: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface UserCreatePayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  phone?: string;
  department?: string;
}

export interface UserCreateResponse {
  user: UserProfile;
  temp_password: string;
}

export interface UserUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  role_id?: number;
  phone?: string;
  department?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
