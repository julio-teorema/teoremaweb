import { Route } from '@angular/router';
import { authGuard } from '@org/core/auth';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'select-company-group',
    loadComponent: () =>
      import(
        './features/auth/select-company-group/select-company-group.component'
      ).then((m) => m.SelectCompanyGroupComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'tickets',
        pathMatch: 'full',
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/tickets.component').then(
            (m) => m.TicketsComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
