import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Обязательно для async и control flow
import { ActivatedRoute } from '@angular/router';
import { SongInterface, AlbumInterface } from '../../core/models/models';
import { MusicStoreService } from '../../core/services/music-store-service/music-store';
import { PlayerService } from '../../core/services/player-service/player-service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-song',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './song.html',
  styleUrl: './song.scss',
})
export class Song implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly musicStore = inject(MusicStoreService);
  public readonly playerService = inject(PlayerService);
  currentTrack$: Observable<SongInterface | null> =
    this.playerService.currentTrack$;
  album: AlbumInterface | null = null;
  song: SongInterface | null = null;

  ngOnInit() {
    // Сохраняем логику роутинга для прямой навигации
    const collectionId = this.route.snapshot.paramMap.get('collectionId');
    const songId = this.route.snapshot.paramMap.get('songId');

    if (collectionId && songId) {
      const allSongs = this.musicStore.currentSongs();
      const allAlbums = this.musicStore.currentAlbums();

      this.album =
        allAlbums.find((a) => String(a.id) === String(collectionId)) || null;
      this.song = allSongs.find((s) => String(s.id) === String(songId)) || null;
    }
  }

  close() {
    this.playerService.toggleExpanded(false);
  }

  onSeek(e: Event) {
    const val = Number((e.target as HTMLInputElement).value);
    this.playerService.seekTo(val);
  }

  formatTime(time: number | null): string {
    if (time === null || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
