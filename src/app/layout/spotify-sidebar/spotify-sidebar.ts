import { Component, HostListener, inject, Input, signal } from '@angular/core';
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
    '[style.width.px]': 'sidebarWidth()',
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
  readonly COLLAPSE_THRESHOLD = 190;
  readonly MAX_WIDTH = 450;
  readonly DEFAULT_WIDTH = 280;

  sidebarWidth = signal(this.DEFAULT_WIDTH);
  isResizing = signal(false);

  constructor() {
    this.checkCollapseState(this.DEFAULT_WIDTH);
  }

  // --- TOGGLE LOGIC ---
  toggleCollapse() {
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
    const target = event.target as HTMLElement;
    if (target.classList.contains('resizer-handle')) {
      this.isResizing.set(true);
      event.preventDefault();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing()) return;
    let newWidth = event.clientX;
    if (newWidth < this.MIN_WIDTH) newWidth = this.MIN_WIDTH;
    if (newWidth > this.MAX_WIDTH) newWidth = this.MAX_WIDTH;
    this.sidebarWidth.set(newWidth);
    this.checkCollapseState(newWidth);
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isResizing.set(false);
  }

  private checkCollapseState(width: number) {
    const shouldBeCollapsed = width < this.COLLAPSE_THRESHOLD;
    if (this.layoutService.isSidebarCollapsed() !== shouldBeCollapsed) {
      this.layoutService.isSidebarCollapsed.set(shouldBeCollapsed);
    }
  }

  // Навигация
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
