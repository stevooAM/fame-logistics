export interface ActiveSession {
  token_id: number;
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
}
