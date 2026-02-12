import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'v3ndor_theme';

  readonly theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const current = this.theme();
      this.applyTheme(current);
      localStorage.setItem(this.STORAGE_KEY, current);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
