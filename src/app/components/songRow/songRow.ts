import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SongInterface } from '../../interface/models';
import { FormatTimePipe } from '../../pipes/format-time-pipe';
import { NavigationService } from '../../services/navigationService/navigation-service';

@Component({
  selector: 'app-songRow',
  standalone: true,
  imports: [CommonModule, FormatTimePipe],
  templateUrl: './songRow.html',
  styleUrl: './songRow.scss',
})
export class SongRow {
  private router = inject(Router);
  private nav = inject(NavigationService);

  @Input({ required: true }) song!: SongInterface;
  // ИСПРАВЛЕНИЕ: Тип теперь поддерживает и числа, и ссылки [cite: 2025-12-14]
  @Input() index: number | string = 0;
  @Input() currentTrack: SongInterface | null = null;
  @Input() isPlaying: boolean = false;

  @Output() playRequest = new EventEmitter<SongInterface>();

  /**
   * Определяет, нужно ли рендерить обложку вместо цифры [cite: 2025-12-14]
   */
  get thumbnailUrl(): string | null {
    if (
      typeof this.index === 'string' &&
      (this.index.includes('/') ||
        this.index.includes('assets') ||
        this.index.startsWith('http'))
    ) {
      return this.index;
    }
    return null;
  }

  /**
   * Флаг режима поиска для применения CSS-классов [cite: 2025-12-14]
   */
  get isSearchMode(): boolean {
    return !!this.thumbnailUrl;
  }

  get isCurrent(): boolean {
    return (
      this.currentTrack !== null &&
      String(this.currentTrack.id) === String(this.song.id)
    );
  }

  handlePlay(event: MouseEvent) {
    event.stopPropagation(); // Предотвращаем всплытие клика [cite: 2025-12-14]
    this.playRequest.emit(this.song);
  }

  onCardClick(id: string) {
    if (id) {
      this.nav.goToArtist(id);
    }
  }
}
