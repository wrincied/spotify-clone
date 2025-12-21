import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  private nav = inject(NavigationService);

  @Input({ required: true }) song!: SongInterface;
  @Input() index: number | string = 0;
  @Input() currentTrack: SongInterface | null = null;
  @Input() isPlaying: boolean = false;

  // Контекст страницы для управления стилями и логикой [cite: 2025-12-14]
  @Input() context: 'album' | 'artist' | 'playlist' | 'search' = 'album';

  // Флаг принудительного показа индекса (например, для Artist Page на мобилках)
  @Input() forceShowIndex: boolean = false;

  @Output() playRequest = new EventEmitter<SongInterface>();

  /**
   * Показываем колонку если:
   * 1. Принудительно попросили (forceShowIndex)
   * 2. ИЛИ это не плейлист (в плейлистах на мобилках скрываем по умолчанию через CSS, но в DOM оставляем для десктопа)
   * Логика: мы всегда рендерим колонку, кроме случаев, когда контекст явно требует её удаления из DOM для оптимизации.
   * Но в данном случае лучше управлять видимостью через CSS, а здесь вернуть true, чтобы элементы были доступны.
   * Однако, для чистоты DOM:
   */
  get shouldShowIndexCol(): boolean {
    return true; // Рендерим всегда, скрываем через CSS (лучше для адаптива) [cite: 2025-12-14]
  }

  /**
   * Режим отображения обложки вместо цифры
   */
  get isThumbnailMode(): boolean {
    return this.context === 'search' || this.context === 'artist';
  }

  /**
   * URL обложки (берем из index, если это строка URL)
   */
  get thumbnailUrl(): string | null {
    if (this.isThumbnailMode && typeof this.index === 'string') {
      return this.index;
    }
    return null;
  }

  get isCurrent(): boolean {
    return (
      this.currentTrack !== null &&
      String(this.currentTrack.id) === String(this.song.id)
    );
  }

  handlePlay(event: MouseEvent) {
    event.stopPropagation();
    this.playRequest.emit(this.song);
  }

  onCardClick(id: string) {
    if (id) {
      this.nav.goToArtist(id);
    }
  }
}
