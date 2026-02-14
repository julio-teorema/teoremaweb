import { User, CompanyGroup } from '@org/shared/models';

export const MOCK_COMPANY_GROUPS: CompanyGroup[] = [
  {
    id: 'cg1',
    name: 'Teorema Software',
    alias: 'teorema',
    ref: '001',
    active: true,
  },
  {
    id: 'cg2',
    name: 'V3ndor Corp',
    alias: 'v3ndor',
    ref: '002',
    active: true,
  },
  {
    id: 'cg3',
    name: 'Redline Systems',
    alias: 'redline',
    ref: '003',
    active: true,
  },
];

export const MOCK_USERS: User[] = [
  {
    id: '52ce1683-d7fd-4182-9478-e29330c2ec08',
    email: 'admin@v3ndor.com',
    name: 'Administrador',
    company_groups: [MOCK_COMPANY_GROUPS[0], MOCK_COMPANY_GROUPS[1]],
  },
  {
    id: '52ce1683-d7fd-4182-9478-e29330c2ec08',
    email: 'user@v3ndor.com',
    name: 'Usuário Teste',
    company_groups: [MOCK_COMPANY_GROUPS[0]],
  },
  {
    id: '52ce1683-d7fd-4182-9478-e29330c2ec08',
    email: 'dev@v3ndor.com',
    name: 'Desenvolvedor',
    company_groups: [MOCK_COMPANY_GROUPS[1], MOCK_COMPANY_GROUPS[2]],
  },
];

// Senha padrão para todos: 123456
export const MOCK_PASSWORD = '123456';

export function validateCredentials(email: string, password: string): User | null {
  if (password !== MOCK_PASSWORD) {
    return null;
  }
  return MOCK_USERS.find((u) => u.email === email) || null;
}

export function generateMockToken(userId: string): string {
  return `mock-token-${userId}-${Date.now()}`;
}
