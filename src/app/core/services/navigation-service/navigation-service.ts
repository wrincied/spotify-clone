import { Injectable, Inject, inject } from '@angular/core';
import { Router } from '@angular/router';
Router
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);

  /**
   * Универсальный метод навигации с обработкой ошибок 
   */
  private internalNavigate(path: any[]) {
    return this.router.navigate(path)
      .then(success => {
        if (success) console.log(`🚀 [Router] Переход на ${path.join('/')} успешен!`);
        else console.warn(`⚠️ [Router] Переход на ${path.join('/')} отклонен`);
      })
      .catch(err => console.error('🔥 [Router] Ошибка:', err));
  }

  goToArtist(id: string) { this.internalNavigate(['/artist', id]); }
  goToAlbum(id: string) { this.internalNavigate(['/album', id]); }
  goToCategory(id: string) { this.internalNavigate(['/category', id]); }
}