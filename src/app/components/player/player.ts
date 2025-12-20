import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../services/playerService/player-service';
import { SongInterface } from '../../interface/models';
import { Observable } from 'rxjs';
import { NavigationService } from '../../services/navigationService/navigation-service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
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

  togglePlay() {
    this.playerService.togglePlay();
  }

  nextTrack() {
    this.playerService.nextTrack();
  }

  prevTrack() {
    this.playerService.prevTrack();
  }

  onSeek(e: Event) {
    this.playerService.seekTo(Number((e.target as HTMLInputElement).value));
  }

  toggleLoop() {
    this.playerService.toggleLoop();
  }
  toggleShuffle() {
    this.playerService.toggleShuffle();
  }
  onVolumeChange(e: Event) {
    // Если слайдер от 0 до 100, делим на 100. Если от 0 до 1, используем как есть.
    const val = Number((e.target as HTMLInputElement).value);
    this.playerService.setVolume(val > 1 ? val / 100 : val);
  }

  formatTime(time: number | null): string {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
  navToArtist(id: string) {
    if (id) {
      this.nav.goToArtist(id);
    }
  }
  navToAlbum(id: string) {
    if (id) {
      this.nav.goToAlbum(String(id));
    }
  }
}
