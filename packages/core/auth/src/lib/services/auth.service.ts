import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, delay, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  User,
  CompanyGroup,
  AuthResponse,
  LoginCredentials,
} from '@org/shared/models';
import {
  validateCredentials,
  generateMockToken,
} from '@org/shared/mocks';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'v3ndor_token';
  private readonly USER_KEY = 'v3ndor_user';
  private readonly COMPANY_GROUP_KEY = 'v3ndor_company_group';

  private currentUserSignal = signal<User | null>(null);
  private currentTokenSignal = signal<string | null>(null);
  private selectedCompanyGroupSignal = signal<CompanyGroup | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly currentToken = this.currentTokenSignal.asReadonly();
  readonly selectedCompanyGroup = this.selectedCompanyGroupSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentToken());

  constructor() {
    this.loadFromStorage();
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const user = validateCredentials(credentials.email, credentials.password);

    if (!user) {
      return throwError(() => new Error('Credenciais inválidas')).pipe(
        delay(500)
      );
    }

    const token = generateMockToken(user.id);

    return of({ token, user }).pipe(
      delay(500),
      tap((response) => {
        this.currentTokenSignal.set(response.token);
        this.currentUserSignal.set(response.user);
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      })
    );
  }

  selectCompanyGroup(companyGroup: CompanyGroup): void {
    this.selectedCompanyGroupSignal.set(companyGroup);
    localStorage.setItem(
      this.COMPANY_GROUP_KEY,
      JSON.stringify(companyGroup)
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.currentTokenSignal.set(null);
    this.selectedCompanyGroupSignal.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.COMPANY_GROUP_KEY);
    this.router.navigate(['/login']);
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);
    const companyGroupJson = localStorage.getItem(this.COMPANY_GROUP_KEY);

    // Forçar limpeza se o usuário tiver ID antigo (inválido)
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.id === '1' || user.id === '2' || user.id === '3' ||
        user.id === '350653dc-10e1-11ec-ac10-0242ac140002' ||
        user.id === '0000113a-f53b-11eb-8b5d-0242ac160002') {
        // Limpar storage para forçar novo login com UUID correto
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.COMPANY_GROUP_KEY);
        this.currentUserSignal.set(null);
        this.currentTokenSignal.set(null);
        this.selectedCompanyGroupSignal.set(null);
        return;
      }
    }

    if (token && userJson) {
      this.currentTokenSignal.set(token);
      this.currentUserSignal.set(JSON.parse(userJson));
    }

    if (companyGroupJson) {
      this.selectedCompanyGroupSignal.set(JSON.parse(companyGroupJson));
    }
  }

  getAvailableCompanyGroups(): CompanyGroup[] {
    return this.currentUser()?.company_groups || [];
  }

  hasMultipleCompanyGroups(): boolean {
    return this.getAvailableCompanyGroups().length > 1;
  }
}
