import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, map, switchMap, shareReplay } from 'rxjs';

import { SongRow } from '../../shared/components/song-row/songRow';
import { ArtistService } from '../../core/services/artist-service/artist-service';
import { PlayerService } from '../../core/services/player-service/player-service';
import { MusicStoreService } from '../../core/services/music-store-service/music-store';
import {
  ArtistInterface,
  SongInterface,
  AlbumInterface,
} from '../../core/models/models';
import { albumCard } from '../../shared/components/album-сard/albumCard';

@Component({
  selector: 'app-page-artist',
  standalone: true,
  imports: [CommonModule, SongRow, albumCard],
  templateUrl: './artist-page.html',
  styleUrls: ['./artist-page.scss'],
})
export class PageArtistComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private artistService = inject(ArtistService);
  public playerService = inject(PlayerService);
  public musicStore = inject(MusicStoreService);

  artist$!: Observable<ArtistInterface | null>;
  isArtistPlaying$!: Observable<boolean>;

  ngOnInit() {
    // Получаем ID артиста из параметров маршрута
    const artistId$ = this.route.paramMap.pipe(
      map((params) => params.get('id') as string),
      shareReplay(1),
    );

    // КОМБИНИРУЕМ: Данные артиста из API + Песни и Альбомы из Store
    this.artist$ = artistId$.pipe(
      switchMap((id) =>
        combineLatest([
          this.artistService.getArtist(id),
          this.musicStore.songs$,
          this.musicStore.albums$,
        ]).pipe(
          map(([artist, allSongs, allAlbums]) => {
            if (!artist) return null;

            // 1. Фильтруем песни: ищем те, где artistId совпадает с id артиста
            const topTracks = allSongs.filter(
              (s) => String(s.artistId) === String(artist.id),
            );

            // 2. ИСПРАВЛЕНО: Фильтруем альбомы по artistId, а не по id самого альбома
            const artistAlbums = allAlbums.filter(
              (al: AlbumInterface) => String(al.artistId) === String(artist.id),
            );
            return {
              ...artist,
              topTracks: topTracks,
              albums: artistAlbums,
            } as ArtistInterface;
          }),
        ),
      ),
    );

    // Определение статуса воспроизведения
    this.isArtistPlaying$ = combineLatest([
      this.playerService.isPlaying$,
      this.playerService.currentTrack$,
      this.artist$,
    ]).pipe(
      map(([isPlaying, currentTrack, artist]) => {
        if (!currentTrack || !artist) return false;
        return isPlaying && String(currentTrack.artistId) === String(artist.id);
      }),
    );
  }

  togglePlayArtist(event: MouseEvent, artist: ArtistInterface) {
    event.stopPropagation();
    if (!artist.topTracks || artist.topTracks.length === 0) return;

    const currentTrack = this.playerService.currentTrack();

    // Если играет текущий артист — переключаем паузу
    if (currentTrack && String(currentTrack.artistId) === String(artist.id)) {
      this.playerService.togglePlay();
    } else {
      // Начинаем играть список популярных треков
      this.playerService.playTrackList(artist.topTracks, 0);
    }
  }

  /**
   * Получение года из описания или даты альбома
   */
  getYear(album: AlbumInterface): string {
    const yearMatch = album.description?.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : '2024';
  }
  getAlbumByTrack(
    track: SongInterface,
    albums: AlbumInterface[],
  ): AlbumInterface | undefined {
    if (!track.albumId || !albums) return undefined;
    return albums.find((a) => String(a.id) === String(track.albumId));
  }
}
