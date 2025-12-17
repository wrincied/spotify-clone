// src/app/pages/artist-page/artist-page.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, map, switchMap, shareReplay } from 'rxjs';

// Импорты компонентов UI
import { SongRow } from '../../components/songRow/songRow';

// Сервисы
import { ArtistService } from '../../services/artistService/artist-service';
import { PlayerService } from '../../services/playerService/player-service';

// Интерфейсы (Важно: используем правильные названия)
import {
  ArtistInterface,
  SongInterface,
  AlbumInterface,
} from '../../interface/models';
import { MusicStoreService } from '../../services/music-store/music-store';

@Component({
  selector: 'app-page-artist',
  standalone: true,
  imports: [CommonModule, SongRow],
  templateUrl: './artist-page.html',
  styleUrls: ['./artist-page.scss'],
})
export class PageArtistComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private artistService = inject(ArtistService);
  public playerService = inject(PlayerService); // public, чтобы юзать в HTML

  // Используем точные типы из models.ts
  artist$!: Observable<ArtistInterface>;
  topTracks$!: Observable<SongInterface[]>;
  albums$!: Observable<AlbumInterface[]>;

  // Состояние: играет ли сейчас трек этого артиста?
  isPlayingThisArtist$!: Observable<boolean>;

  ngOnInit() {
    // 1. Получаем ID из URL (например, /artist/123)
    const artistId$ = this.route.paramMap.pipe(
      map((params) => params.get('id') as string),
      shareReplay(1), // Кэшируем ID, чтобы не дергать роут трижды
    );

    // 2. Загружаем данные (Параллельные потоки)
    this.artist$ = artistId$.pipe(
      switchMap((id) => this.artistService.getArtist(id)),
    );

    this.topTracks$ = artistId$.pipe(
      switchMap((id) => this.artistService.getTopTracks(id)),
    );

    this.albums$ = artistId$.pipe(
      switchMap((id) => this.artistService.getAlbums(id)),
    );

    // 3. Логика для кнопки "Play/Pause" в шапке профиля
    this.isPlayingThisArtist$ = combineLatest([
      this.playerService.isPlaying$, // Играет ли плеер вообще?
      this.playerService.currentTrack$, // Какой трек играет?
      this.artist$, // Какой артист открыт?
    ]).pipe(
      map(([isPlaying, currentTrack, currentPageArtist]) => {
        if (!currentTrack || !currentPageArtist) return false;

        // Сравниваем ID артиста из трека с ID артиста на странице
        // Если у трека нет artistId, фолбэк на сравнение имен
        const trackArtistId = currentTrack.artistId;
        const pageArtistId = currentPageArtist.id;

        if (trackArtistId) {
          return isPlaying && trackArtistId === pageArtistId;
        }

        return isPlaying && currentTrack.artist === currentPageArtist.name;
      }),
    );
  }

  // Запуск списка популярных треков
  playPopular(tracks: SongInterface[]) {
    if (!tracks || tracks.length === 0) return;
    // Передаем весь список треков, начинаем с 0-го
    this.playerService.playTrackList(tracks, 0);
  }

  toggleFollow() {
    console.log('Follow clicked (Logic not implemented yet)');
  }
}
