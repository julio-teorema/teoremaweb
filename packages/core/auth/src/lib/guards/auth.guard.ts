import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Se autenticado mas sem company_group selecionado e tem múltiplos
    if (
      !authService.selectedCompanyGroup() &&
      authService.hasMultipleCompanyGroups()
    ) {
      router.navigate(['/select-company-group']);
      return false;
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};
