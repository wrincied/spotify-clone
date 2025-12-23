import { Component, HostListener, inject, Input, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../../core/services/spotify-service/spotify-service';
import { LayoutService } from '../../core/services/layout-service/layout-service';
import { PlayerService } from '../../core/services/player-service/player-service';

@Component({
  selector: 'app-spotify-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spotify-sidebar.html',
  styleUrl: './spotify-sidebar.scss',
  host: {
    // ВАЖНО: Используем computed св-во, чтобы не вешать пиксели на мобилке
    '[style.width]': 'hostWidth()', 
    '[class.is-resizing]': 'isResizing()',
    '[class.collapsed-host]': 'layoutService.isSidebarCollapsed()',
  },
})
export class SpotifySidebar {
  @Input() isActiveSearch = false;

  public layoutService = inject(LayoutService);
  public readonly playerService = inject(PlayerService);
  private spotifyService = inject(SpotifyService);
  private router = inject(Router);

  readonly MIN_WIDTH = 72;
  readonly COLLAPSE_THRESHOLD = 150; // Чуть уменьшил порог для плавности
  readonly MAX_WIDTH = 450;
  readonly DEFAULT_WIDTH = 280;

  // Текущая ширина (логическая)
  sidebarWidth = signal(this.DEFAULT_WIDTH);
  isResizing = signal(false);

  // === 1. УМНАЯ ШИРИНА ===
  // Если мобилка — возвращаем '100%' или 'auto' (пусть CSS рулит)
  // Если десктоп — возвращаем пиксели
  hostWidth = computed(() => {
    if (this.layoutService.isMobile()) {
      return '100%'; 
    }
    return `${this.sidebarWidth()}px`;
  });

  constructor() {
    // Инициализация начального состояния
    this.checkCollapseState(this.DEFAULT_WIDTH);
  }

  // --- TOGGLE LOGIC ---
  toggleCollapse() {
    // На мобильных кнопка collapse обычно скрыта, но на всякий случай блокируем логику
    if (this.layoutService.isMobile()) return;

    const isCollapsed = this.layoutService.isSidebarCollapsed();
    if (isCollapsed) {
      this.sidebarWidth.set(this.DEFAULT_WIDTH);
      this.layoutService.isSidebarCollapsed.set(false);
    } else {
      this.sidebarWidth.set(this.MIN_WIDTH);
      this.layoutService.isSidebarCollapsed.set(true);
    }
  }

  // --- RESIZE LOGIC ---
  @HostListener('mousedown', ['$event'])
  startResizing(event: MouseEvent) {
    // Запрещаем ресайз на мобильных
    if (this.layoutService.isMobile()) return;

    const target = event.target as HTMLElement;
    if (target.classList.contains('resizer-handle')) {
      this.isResizing.set(true);
      event.preventDefault(); // Чтобы текст не выделялся при перетаскивании
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing()) return;

    let newWidth = event.clientX;
    
    // Ограничители
    if (newWidth < this.MIN_WIDTH) newWidth = this.MIN_WIDTH;
    if (newWidth > this.MAX_WIDTH) newWidth = this.MAX_WIDTH;
    
    this.sidebarWidth.set(newWidth);
    this.checkCollapseState(newWidth);
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing()) {
      this.isResizing.set(false);
    }
  }

  private checkCollapseState(width: number) {
    if (this.layoutService.isMobile()) return; // Не меняем стейт на мобилке

    const shouldBeCollapsed = width < this.COLLAPSE_THRESHOLD;
    
    // Меняем сигнал только если состояние реально изменилось (оптимизация)
    if (this.layoutService.isSidebarCollapsed() !== shouldBeCollapsed) {
      this.layoutService.isSidebarCollapsed.set(shouldBeCollapsed);
    }
  }

  // --- NAVIGATION ---
  goToHome() {
    this.spotifyService.clearSearch();
    this.router.navigate(['/']);
  }
  goToLibrary() {
    this.spotifyService.clearSearch();
    this.router.navigate(['/library']);
  }
  goToSearch() {
    this.router.navigate(['/search']);
  }
  goToCreatePlaylist() {
    this.spotifyService.clearSearch();
    this.router.navigate(['/create-playlist']);
  }
}