import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private platformId = inject(PLATFORM_ID);

  isSidebarCollapsed = signal(false);
  // Инициализируем сразу при создании сервиса (только в браузере)
  isMobile = signal(this.checkIsMobile());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', () => {
        this.isMobile.set(this.checkIsMobile());
      });
    }
  }

  private checkIsMobile(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth <= 768;
    }
    return false;
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update((val) => !val);
  }
}
