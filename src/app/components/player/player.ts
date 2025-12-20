import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../services/playerService/player-service';
import { SongInterface } from '../../interface/models';
import { Observable } from 'rxjs';
import { NavigationService } from '../../services/navigationService/navigation-service';
import { Song } from '../../pages/song/song';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, Song],
  templateUrl: './player.html',
  styleUrls: ['./player.scss'],
})
export class PlayerComponent {
  // Внедряем синглтон
  public playerService = inject(PlayerService);
  private nav = inject(NavigationService);
  // === ИСПРАВЛЕННЫЕ ПОТОКИ ===
  currentTrack$: Observable<SongInterface | null> =
    this.playerService.currentTrack$;
  isPlaying$: Observable<boolean> = this.playerService.isPlaying$;
  currentTime$: Observable<number> = this.playerService.currentTime$;
  duration$: Observable<number> = this.playerService.duration$;
  isBuffering$: Observable<boolean> = this.playerService.isBuffering$;
  isLooping$: Observable<boolean> = this.playerService.isLooping$;
  isSchuffling$: Observable<boolean> = this.playerService.isShuffling$;
  // ФИКС: Теперь это поток строки URL из сигнала сервиса
  currentCover$: Observable<string> = this.playerService.currentCover$;
  handlePlayerClick(event: Event) {
    // Проверяем ширину экрана, чтобы не срабатывало на десктопе
    if (window.innerWidth <= 768) {
      this.playerService.isExpanded.set(true);
    }
  }

  /**
   * Кнопка расширения (для десктопа)
   */
  expandPlayer(event: Event) {
    event.stopPropagation();
    this.playerService.isExpanded.set(true);
  }

  // === УПРАВЛЕНИЕ (с защитой от всплытия событий) ===

  togglePlay(event?: Event) {
    event?.stopPropagation();
    this.playerService.togglePlay();
  }

  nextTrack(event?: Event) {
    event?.stopPropagation();
    this.playerService.nextTrack();
  }

  prevTrack(event?: Event) {
    event?.stopPropagation();
    this.playerService.prevTrack();
  }

  toggleLoop(event?: Event) {
    event?.stopPropagation();
    this.playerService.toggleLoop();
  }

  toggleShuffle(event?: Event) {
    event?.stopPropagation();
    this.playerService.toggleShuffle();
  }

  onSeek(e: Event) {
    e.stopPropagation(); // Важно, чтобы слайдер не вызывал открытие окна
    this.playerService.seekTo(Number((e.target as HTMLInputElement).value));
  }

  onVolumeChange(e: Event) {
    e.stopPropagation();
    const val = Number((e.target as HTMLInputElement).value);
    this.playerService.setVolume(val > 1 ? val / 100 : val);
  }

  // === НАВИГАЦИЯ ===

  navToArtist(id: string, event?: Event) {
    event?.stopPropagation();
    if (id) {
      this.nav.goToArtist(id);
    }
  }

  navToAlbum(id: string, event?: Event) {
    event?.stopPropagation();
    if (id) {
      this.nav.goToAlbum(String(id));
    }
  }

  // === УТИЛИТЫ ===

  formatTime(time: number | null): string {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
