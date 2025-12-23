import { Component, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
@Component({
  selector: 'app-cookie-consent',
  imports: [],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.scss',
})
export class CookieConsent {
  isVisible = signal(false);

  constructor() {
    // ВАЖНО: Проверяем localStorage только в браузере
    afterNextRender(() => {
      const consent = localStorage.getItem('spotify_clone_consent');
      if (!consent) {
        // Небольшая задержка, чтобы интерфейс успел прогрузиться
        setTimeout(() => this.isVisible.set(true), 1000);
      }
    });
  }

  accept() {
    localStorage.setItem('spotify_clone_consent', 'true');
    this.isVisible.set(false);
  }
}
