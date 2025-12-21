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
    const term = (this.query || '').trim().toLowerCase();

    // Сброс состояний
    this.topTrack = null;
    this.topAlbumResult = null;
    this.topAlbumFullSongs = [];
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

    if (exactAlbumMatch) {
      this.topAlbumResult = exactAlbumMatch;
    } else if (exactTrackMatch) {
      this.topTrack = exactTrackMatch;
    } else {
      // Если точного совпадения нет, берем первый попавшийся
      if (this.filteredAlbums.length > 0)
        this.topAlbumResult = this.filteredAlbums[0];
      else if (matchingTracks.length > 0) this.topTrack = matchingTracks[0];
    }

    // 4. Формирование списка Songs
    // Убираем дубль, если он уже показан в Top Result
    // Ограничиваем список 4 песнями
    this.filteredTracks = matchingTracks
      .filter((t) => t.id !== this.topTrack?.id)
      .slice(0, 4);

    // 5. Подготовка плейлиста для Top Album (только валидные треки)
    if (this.topAlbumResult) {
      const albumSongs = allTracks.filter(
        (t) => String(t.albumId) === String(this.topAlbumResult?.id),
      );
      this.filteredTracks = albumSongs.slice(0, 4);
      // Подготовка для проигрывания (с URL)
      this.topAlbumFullSongs = albumSongs.filter(
        (s) => !!s.url && s.url.trim() !== '',
      );
    } else {
      // Если топ-результат ПЕСНЯ -> показываем остальные найденные совпадения
      this.filteredTracks = matchingTracks
        .filter((t) => t.id !== this.topTrack?.id)
        .slice(0, 4);
    }
    this.cdr.markForCheck();
  }

  handlePlay(trackOrId: TrackWithContext | SongInterface | string): void {
    if (!trackOrId) return;
    const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;

    // Если кликнули на Top Album Card
    if (
      this.topAlbumResult &&
      this.topAlbumFullSongs.length > 0 &&
      (this.topAlbumResult.songs || []).some((id: any) => {
        const sId = typeof id === 'string' ? id : id.id;
        return String(sId) === String(trackId);
      })
    ) {
      const validSong = this.topAlbumFullSongs.find(
        (s) => String(s.id) === String(trackId),
      );
      const startIndex = validSong
        ? this.topAlbumFullSongs.indexOf(validSong)
        : 0;

      this.playerService.playTrackList(
        this.topAlbumFullSongs,
        startIndex,
        this.topAlbumResult.cover || '',
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
          fullSong.thumbnail || '',
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
