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
            topTracks.sort((a, b) => {
              return String(a.id).localeCompare(String(b.id), undefined, {
                numeric: true,
              });
            });

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
    if (!artist.topTracks) return;
    const playableTracks = artist.topTracks.filter((track) => !!track.url);
    if (playableTracks.length === 0) {
      console.warn('Нет доступных песен для воспроизведения у этого артиста.');
      return;
    }
    const currentTrack = this.playerService.currentTrack();
    const isPlayingFromThisList =
      currentTrack &&
      playableTracks.some((t) => String(t.id) === String(currentTrack.id));

    if (isPlayingFromThisList) {
      this.playerService.togglePlay();
    } else {
      console.log(
        `[ArtistPage] Запускаем ${playableTracks.length} песен из ${artist.topTracks.length}`,
      );
      // Запускаем чистый список с 0-го индекса
      this.playerService.playTrackList(playableTracks, 0);
    }
  }
  onTrackPlayRequest(allTracks: SongInterface[], index: number) {
    // Вызываем метод сервиса, который сам проверит URL и сформирует очередь
    const started = this.playerService.playWithValidation(allTracks, index);
    
    if (!started) {
      alert("That Song doesn't have a URL, choose another one. Hint: with active duration");
    }
  }
  //  * Получение года из описания или даты альбома
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
