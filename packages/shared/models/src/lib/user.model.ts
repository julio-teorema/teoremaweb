export interface User {
  id: string;
  email: string;
  name: string;
  company_groups: CompanyGroup[];
}

export interface CompanyGroup {
  id: string;
  name: string;
  alias: string;
  ref?: string;
  active?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  company_groups?: CompanyGroup[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}
