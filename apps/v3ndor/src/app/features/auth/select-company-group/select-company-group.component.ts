import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@org/core/auth';
import { CompanyGroup } from '@org/shared/models';

@Component({
  selector: 'app-select-company-group',
  standalone: true,
  imports: [],
  templateUrl: './select-company-group.component.html',
  styleUrls: ['./select-company-group.component.scss'],
})
export class SelectCompanyGroupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  companyGroups = signal<CompanyGroup[]>([]);
  selectedGroup = signal<CompanyGroup | null>(null);

  constructor() {
    const groups = this.authService.getAvailableCompanyGroups();
    this.companyGroups.set(groups);

    if (groups.length === 0) {
      this.router.navigate(['/login']);
    }
  }

  selectGroup(group: CompanyGroup): void {
    this.selectedGroup.set(group);
  }

  confirm(): void {
    const group = this.selectedGroup();
    if (group) {
      this.authService.selectCompanyGroup(group);
      this.router.navigate(['/']);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
