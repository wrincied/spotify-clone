import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicStoreService } from '../../services/music-store/music-store';
import { SongInterface } from '../../interface/models'; // Чистый интерфейс
import { Observable } from 'rxjs';
import { FormatTimePipe } from '../../pipes/format-time-pipe'; // <--- НУЖЕН ЭТОТ ИМПОРТ
import { Subscription } from 'rxjs'; // Добавьте Subscription

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormatTimePipe],
  templateUrl: './player.html',
  styleUrls: ['./player.scss'],
})
export class PlayerComponent {
  isLooping$: Observable<boolean>;
  currentTrack$: Observable<SongInterface | null>;
  currentCover$: Observable<string>; // <-- Отдельный поток для картинки
  @Input() thumbnailUrl?: string | null;
  isPlaying$: Observable<boolean>;
  currentTime$: Observable<number>;
  duration$: Observable<number>;
  isBuffering$: Observable<boolean>;

  constructor(private musicStore: MusicStoreService) {
    this.currentTrack$ = this.musicStore.currentTrack$;
    this.currentCover$ = this.musicStore.currentCover$; // Подписка
    this.isLooping$ = this.musicStore.isLooping$;
    this.isPlaying$ = this.musicStore.isPlaying$;
    this.currentTime$ = this.musicStore.currentTime$;
    this.duration$ = this.musicStore.duration$;
    this.isBuffering$ = this.musicStore.isBuffering$;
  }

  togglePlay() {
    this.musicStore.togglePlay();
  }
  nextTrack() {
    this.musicStore.nextTrack();
  }
  prevTrack() {
    this.musicStore.prevTrack();
  }
  onSeek(e: Event) {
    this.musicStore.seekTo(Number((e.target as HTMLInputElement).value));
  }
  toggleLoop() {
    this.musicStore.toggleLoop();
  }
  onVolumeChange(e: Event) {
    this.musicStore.setVolume(
      Number((e.target as HTMLInputElement).value) / 100,
    );
  }

  formatTime(time: number | null): string {
    if (!time) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
