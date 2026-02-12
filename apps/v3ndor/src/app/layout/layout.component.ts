import { Component, signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@org/core/auth';
import { ThemeService } from '../core/services/theme.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);

  expandedMenus = signal<Set<string>>(new Set(['Ticket Center']));

  navItems: NavItem[] = [
    {
      label: 'Ticket Center',
      icon: 'pi pi-ticket',
      children: [
        { label: 'Chamados', icon: 'pi pi-list', route: '/chamados' },
      ],
    },
    { label: 'CRM', icon: 'pi pi-users', route: '/crm' },
    { label: 'Vendas', icon: 'pi pi-shopping-cart', route: '/vendas' },
    { label: 'Cotações', icon: 'pi pi-file', route: '/cotacoes' },
  ];

  isParentActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some((c) => c.route && this.router.url.startsWith(c.route));
  }

  toggleMenu(label: string): void {
    this.expandedMenus.update((set) => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}
