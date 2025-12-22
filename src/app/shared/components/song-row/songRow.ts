import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlbumInterface, SongInterface } from '../../../core/models/models';
import { FormatTimePipe } from '../../pipes/format-time-pipe';
import { NavigationService } from '../../../core/services/navigation-service/navigation-service';

@Component({
  selector: 'app-songRow',
  standalone: true,
  imports: [CommonModule, FormatTimePipe],
  templateUrl: './songRow.html',
  styleUrl: './songRow.scss',
})
export class SongRow implements OnInit {
  private nav = inject(NavigationService);
  @Input({ required: true }) song!: SongInterface;
  @Input() album?: AlbumInterface;
  @Input() index: number | string = 0;
  @Input() currentTrack: SongInterface | null = null;
  @Input() showAlbum: boolean = true;
  @Input() isPlaying: boolean = false;
  stablePlayCount: number = 0;
  ngOnInit(): void {
    this.stablePlayCount = this.song.playCount || 0;
  }
  // Контекст страницы для управления стилями и логикой
  @Input() context: 'album' | 'artist' | 'playlist' | 'search-album' = 'album';

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
    return true; // Рендерим всегда, скрываем через CSS (лучше для адаптива)
  }

  /**
   * Режим отображения обложки вместо цифры
   */
  get isThumbnailMode(): boolean {
    return this.context === 'search-album';
    // || this.context === 'artist'
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
