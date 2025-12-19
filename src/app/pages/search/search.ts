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
import { FormsModule } from '@angular/forms'; // 1. ИМПОРТИРУЕМ МОДУЛЬ [cite: 2025-12-14]

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
  // 2. ДОБАВЛЯЕМ FormsModule В ИМПОРТЫ [cite: 2025-12-14]
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
  topAlbumSongs: TrackWithContext[] = [];

  topTrack: TrackWithContext | null = null;
  topAlbumResult: AlbumInterface | null = null;

  currentTrack$: Observable<SongInterface | null> =
    this.playerService.currentTrack$;
  isPlaying$: Observable<boolean> = this.playerService.isPlaying$;

  ngOnInit(): void {
    this.subs.add(
      this.route.queryParams.subscribe((params) => {
        const q = (params['q'] ?? '').toString();
        this.query = q;
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

    this.topTrack = null;
    this.topAlbumResult = null;
    this.filteredAlbums = [];
    this.filteredTracks = [];
    this.topAlbumSongs = [];

    if (!allAlbums || allAlbums.length === 0 || !term) {
      this.cdr.markForCheck();
      return;
    }

    const allTracks: TrackWithContext[] = [];

    allAlbums.forEach((album) => {
      if (album?.songs && Array.isArray(album.songs)) {
        album.songs.forEach((songId: any, index: number) => {
          const id = typeof songId === 'string' ? songId : songId?.id;
          const fullSong = allSongsInStore.find(
            (s) => String(s.id) === String(id),
          );

          if (fullSong) {
            allTracks.push({
              ...fullSong,
              id: fullSong.id,
              albumId: album.id,
              coverFromAlbum:
                album.cover || album.thumbnail || fullSong.thumbnail || null,
              thumbnail:
                fullSong.thumbnail || album.cover || 'assets/no-album.png',
            });
          }
        });
      }
    });

    this.filteredAlbums = allAlbums.filter((album) => {
      const title = (album?.title || '').toLowerCase();
      const desc = (album?.description || '').toLowerCase();
      return title.includes(term) || desc.includes(term);
    });

    const matchingTracks = allTracks.filter((track) => {
      const title = (track?.title || '').toLowerCase();
      const artist = (track?.artist || '').toLowerCase();
      return title.includes(term) || artist.includes(term);
    });

    const exactAlbumMatch = this.filteredAlbums.find(
      (a) => (a.title || '').toLowerCase() === term,
    );

    const exactTrackMatch = matchingTracks.find(
      (t) => (t.title || '').toLowerCase() === term,
    );

    if (exactAlbumMatch) {
      this.topAlbumResult = exactAlbumMatch;
      this.topTrack = null;
    } else if (exactTrackMatch) {
      this.topTrack = exactTrackMatch;
      this.topAlbumResult = null;
    } else {
      if (matchingTracks.length > 0) {
        this.topTrack = matchingTracks[0];
      } else if (this.filteredAlbums.length > 0) {
        this.topAlbumResult = this.filteredAlbums[0];
      }
    }

    this.filteredTracks = this.topTrack
      ? matchingTracks.filter((t) => t.id !== this.topTrack?.id).slice(0, 4)
      : matchingTracks.slice(0, 4);

    if (this.filteredTracks.length < 4 && this.filteredAlbums.length > 0) {
      const targetAlbum = this.topAlbumResult || this.filteredAlbums[0];

      if (targetAlbum) {
        const rawIds = (targetAlbum.songs || []) as any[];

        this.topAlbumSongs = rawIds
          .map((id) =>
            allSongsInStore.find(
              (s) =>
                String(s.id) === String(typeof id === 'string' ? id : id?.id),
            ),
          )
          .filter((s): s is SongInterface => !!s)
          .map((s, idx) => ({
            ...s,
            id: s.id,
            albumId: targetAlbum.id,
            coverFromAlbum: targetAlbum.cover || targetAlbum.thumbnail || null,
            thumbnail:
              s.thumbnail || targetAlbum.cover || 'assets/no-album.png',
          }))
          .slice(0, 4 - this.filteredTracks.length);
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

    if (this.topAlbumResult && this.topAlbumResult.songs?.length > 0) {
      const firstSongId = this.topAlbumResult.songs[0];
      const idToCheck =
        typeof firstSongId === 'string'
          ? firstSongId
          : (firstSongId as any)?.id;
      return String(current.id) === String(idToCheck);
    }

    return false;
  }

  handlePlay(trackOrId: TrackWithContext | SongInterface | string): void {
    if (!trackOrId) return;

    let trackId: string;
    let providedThumbnail: string | undefined;

    if (typeof trackOrId === 'string') {
      trackId = trackOrId;
    } else {
      trackId = trackOrId.id;
      providedThumbnail =
        (trackOrId as TrackWithContext).coverFromAlbum ??
        trackOrId.thumbnail ??
        undefined;
    }

    const allSongs = this.musicStore.currentSongs();
    const fullSong = allSongs.find((s) => String(s.id) === String(trackId));

    if (!fullSong) {
      console.error(`❌ [Search] Песня ID "${trackId}" не найдена.`);
      return;
    }

    const finalCover: string =
      providedThumbnail ?? fullSong.thumbnail ?? 'assets/no-album.png';

    console.log(`▶️ [Search] Запуск: "${fullSong.title}"`);
    this.playerService.play(fullSong, finalCover);
  }
}
