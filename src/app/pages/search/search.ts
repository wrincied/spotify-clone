import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { MusicStoreService } from '../../services/music-store/music-store';
import { PlayerService } from '../../services/playerService/player-service';
import {
  AlbumInterface,
  ArtistInterface,
  SongInterface,
  TrackWithContext,
} from '../../interface/models';

import { albumCard } from '../../components/albumCard/albumCard';
import { SongRow } from '../../components/songRow/songRow';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule, SongRow, albumCard, FormsModule],
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit, OnChanges, OnDestroy {
  @Input() query = '';

  private readonly playerService = inject(PlayerService);
  private readonly musicStore = inject(MusicStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private subs = new Subscription();

  filteredAlbums: AlbumInterface[] = [];
  filteredTracks: TrackWithContext[] = [];
  filteredArtists: ArtistInterface[] = [];

  topTrack: TrackWithContext | null = null;
  topAlbumResult: AlbumInterface | null = null;

  // Список ТОЛЬКО рабочих песен альбома (с URL) для воспроизведения
  topAlbumFullSongs: SongInterface[] = [];

  currentTrack$: Observable<SongInterface | null> =
    this.playerService.currentTrack$;
  isPlaying$: Observable<boolean> = this.playerService.isPlaying$;

  ngOnInit(): void {
    this.subs.add(
      this.route.queryParams.subscribe((params) => {
        this.query = (params['q'] ?? '').toString();
        this.runFilter();
      }),
    );

    this.subs.add(
      this.musicStore.albums$.subscribe((albums) => {
        this.runFilter(albums);
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['query']) {
      this.runFilter();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onMobileSearch(newQuery: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: newQuery || null },
      queryParamsHandling: 'merge',
    });
  }

  private runFilter(albums?: AlbumInterface[]): void {
    const allAlbums = albums ?? this.musicStore.currentAlbums();
    const allSongsInStore = this.musicStore.currentSongs();
    const allArtists = this.musicStore.currentArtists();

    const term = (this.query || '').trim().toLowerCase();

    // Сброс состояний
    this.topTrack = null;
    this.topAlbumResult = null;
    this.topAlbumFullSongs = [];
    this.filteredArtists = allArtists.filter((a) =>
      a.name.toLowerCase().includes(term),
    );
    this.filteredAlbums = [];
    this.filteredTracks = [];

    if (!allAlbums || allAlbums.length === 0 || !term) {
      this.cdr.markForCheck();
      return;
    }

    // 1. Сбор всех треков (даже без URL, чтобы показать их в поиске)
    const allTracks: TrackWithContext[] = [];
    allAlbums.forEach((album) => {
      (album?.songs || []).forEach((songId: any) => {
        const id = typeof songId === 'string' ? songId : songId?.id;
        const fullSong = allSongsInStore.find(
          (s) => String(s.id) === String(id),
        );
        if (fullSong) {
          allTracks.push({
            ...fullSong,
            albumId: album.id,
            coverFromAlbum: album.cover || fullSong.thumbnail || null,
            thumbnail:
              fullSong.thumbnail || album.cover || 'assets/no-album.png',
          });
        }
      });
    });

    // 2. Фильтрация
    this.filteredAlbums = allAlbums.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term),
    );

    const matchingTracks = allTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.artist.toLowerCase().includes(term),
    );

    // 3. Определение Top Result (Приоритет точного совпадения)
    const exactAlbumMatch = this.filteredAlbums.find(
      (a) => a.title.toLowerCase() === term,
    );
    const exactTrackMatch = matchingTracks.find(
      (t) => t.title.toLowerCase() === term,
    );
    const exactArtist = this.filteredArtists.find(
      (a) => a.name.toLowerCase() === term,
    );
    if (exactArtist) {
      this.topAlbumResult = {
        id: exactArtist.id,
        title: exactArtist.name,
        description: 'Artist',
        cover: exactArtist.avatar || 'assets/no-artist.png',
        artistId: exactArtist.id,
        type: 'artist', // Понадобится для стилей в шаблоне
      } as any;
    } else if (exactAlbumMatch) {
      this.topAlbumResult = exactAlbumMatch;
    } else if (exactTrackMatch) {
      this.topTrack = exactTrackMatch;
    } else {
      // Если точного совпадения нет, берем первый попавшийся
      if (this.filteredAlbums.length > 0)
        this.topAlbumResult = this.filteredAlbums[0];
      else if (matchingTracks.length > 0) this.topTrack = matchingTracks[0];
    }

    // 4. Формирование списка Songs и плейлиста для Top Result
    if (this.topAlbumResult) {
      let topResultSongs: TrackWithContext[] = [];

      // Определяем, является ли топ-результат артистом или альбомом
      if ((this.topAlbumResult as any).type === 'artist') {
        // Это артист, ищем песни по имени артиста
        topResultSongs = allTracks.filter(
          (t) => t.artist.toLowerCase() === this.topAlbumResult!.title.toLowerCase()
        );
      } else {
        // Это альбом, ищем песни по albumId
        topResultSongs = allTracks.filter(
          (t) => String(t.albumId) === String(this.topAlbumResult?.id)
        );
      }

      // Список песен для отображения под топ-результатом
      this.filteredTracks = topResultSongs.slice(0, 4);
      
      // Плейлист для проигрывания самого топ-результата (только с URL)
      this.topAlbumFullSongs = topResultSongs.filter(
        (s) => !!s.url && s.url.trim() !== ''
      );
    } else {
      // Если топ-результат - это песня, или нет топ-результата,
      // показываем другие найденные песни
      this.filteredTracks = matchingTracks
        .filter((t) => t.id !== this.topTrack?.id)
        .slice(0, 4);
    }
    this.cdr.markForCheck();
  }

  handlePlay(trackOrId: TrackWithContext | SongInterface | string): void {
    if (!trackOrId) return;
    const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;
    const isArtist = (this.topAlbumResult as any).type === 'artist';

    // Проверяем, относится ли трек к топ-результату (альбому или артисту)
    const isTrackInTopResult = this.topAlbumFullSongs.some(s => String(s.id) === String(trackId));

    if (this.topAlbumResult && this.topAlbumFullSongs.length > 0 && isTrackInTopResult) {
      const startIndex = this.topAlbumFullSongs.findIndex(
        (s) => String(s.id) === String(trackId)
      );

      this.playerService.playTrackList(
        this.topAlbumFullSongs,
        startIndex >= 0 ? startIndex : 0,
        isArtist? '': this.topAlbumResult.cover || ''
      );
    }
    // Если кликнули на одиночный трек в списке
    else {
      const fullSong = this.musicStore
        .currentSongs()
        .find((s) => String(s.id) === String(trackId));

      if (fullSong?.url) {
        this.playerService.playTrackList(
          [fullSong],
          0,
          fullSong.thumbnail || ''
        );
      }
    }
    this.cdr.markForCheck();
  }

  get isTopResultPlaying(): boolean {
    const current = this.playerService.currentTrack();
    const playing = this.playerService.isPlaying();
    if (!playing || !current) return false;

    if (this.topTrack) {
      return String(current.id) === String(this.topTrack.id);
    }

    if (this.topAlbumResult && this.topAlbumFullSongs.length > 0) {
      return this.topAlbumFullSongs.some(
        (s) => String(s.id) === String(current.id),
      );
    }

    return false;
  }
}
