import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { MusicStoreService } from '../../services/music-store/music-store';
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
  imports: [CommonModule, RouterModule, SongRow, albumCard],
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
})
export class SearchComponent implements OnInit, OnChanges, OnDestroy {
  @Input() query = '';
  @Input() items: AlbumInterface[] = [];

  filteredAlbums: AlbumInterface[] = [];
  filteredTracks: TrackWithContext[] = [];
  topAlbumSongs: TrackWithContext[] = [];
  topTrack: TrackWithContext | null = null;

  // === 1. OBSERVABLES ДЛЯ HTML (чтобы передавать в SongRow через | async) ===
  currentTrack$: Observable<SongInterface | null>;
  isPlaying$: Observable<boolean>;

  // === 2. ЛОКАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ЛОГИКИ (для isTopResultPlaying) ===
  currentTrack: SongInterface | null = null;
  isPlaying: boolean = false;

  private subs: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private musicStore: MusicStoreService,
    private router: Router,
  ) {
    // Инициализируем потоки из сервиса
    this.currentTrack$ = this.musicStore.currentTrack$;
    this.isPlaying$ = this.musicStore.isPlaying$;
  }

  ngOnInit(): void {
    // 1. Следим за URL
    this.subs.add(
      this.route.queryParams.subscribe((params) => {
        const q = (params['q'] ?? '').toString();
        if (q !== this.query) {
          this.query = q;
          this.runFilter();
        }
      }),
    );

    // 2. Следим за альбомами
    this.subs.add(
      this.musicStore.albums$.subscribe((albums) => {
        this.runFilter(albums);
      }),
    );

    // 3. ПОДПИСЫВАЕМСЯ, ЧТОБЫ ОБНОВЛЯТЬ ЛОКАЛЬНЫЕ ПЕРЕМЕННЫЕ
    // Это нужно, чтобы работал твой геттер isTopResultPlaying
    this.subs.add(
      this.currentTrack$.subscribe((track) => {
        this.currentTrack = track;
      }),
    );

    this.subs.add(
      this.isPlaying$.subscribe((state) => {
        this.isPlaying = state;
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

  // ... runFilter оставляем как есть ...
  private runFilter(albums?: AlbumInterface[]): void {
    // ... твой код runFilter ...
    const list = albums ?? this.musicStore.currentAlbums;
    this.topTrack = null;
    this.filteredAlbums = [];
    this.filteredTracks = [];
    this.topAlbumSongs = [];

    if (!list || list.length === 0) return;

    const term = (this.query || '').trim().toLowerCase();
    if (!term) return;

    // 1. Все треки
    const allTracks = list.flatMap<TrackWithContext>((album) =>
      (album.songs || []).map((song) => ({
        ...song,
        albumId: album.id,
        coverFromAlbum: album.cover ?? null,
      })),
    );

    // 2. Альбомы
    this.filteredAlbums = list.filter((album) => {
      const title = (album.title || '').toLowerCase();
      const desc = (album.description || '').toLowerCase();
      return title.includes(term) || desc.includes(term);
    });

    // 3. Песни
    const matchingTracks = allTracks.filter((track) => {
      const title = (track.title || '').toLowerCase();
      const artist = (track.artist || '').toLowerCase();
      return title.includes(term) || artist.includes(term);
    });

    // 4. Логика TOP TRACK
    let bestMatch = matchingTracks.find(
      (t) => (t.title || '').toLowerCase() === term,
    );

    if (
      !bestMatch &&
      matchingTracks.length > 0 &&
      this.filteredAlbums.length === 0
    ) {
      bestMatch = matchingTracks[0];
    }

    if (bestMatch) {
      this.topTrack = bestMatch;
      this.filteredTracks = matchingTracks
        .filter((t) => t.id !== bestMatch!.id)
        .slice(0, 5);
    } else {
      this.topTrack = null;
      this.filteredTracks = matchingTracks.slice(0, 5);
    }

    // 5. Песни из топ-альбома
    const topAlbum = this.filteredAlbums[0];
    if (topAlbum) {
      this.topAlbumSongs = (topAlbum.songs || []).slice(0, 4).map((song) => ({
        ...song,
        albumId: topAlbum.id,
        coverFromAlbum: topAlbum.cover ?? null,
      }));
    }
  }

  get isTopResultPlaying(): boolean {
    // ЗДЕСЬ ИСПОЛЬЗУЕМ ЛОКАЛЬНЫЕ ПЕРЕМЕННЫЕ (boolean и object), А НЕ OBSERVABLES
    if (!this.isPlaying || !this.currentTrack) return false;

    // 1. Если в топе ТРЕК
    if (this.topTrack) {
      return String(this.currentTrack.id) === String(this.topTrack.id);
    }

    // 2. Если в топе АЛЬБОМ
    if (this.filteredAlbums.length > 0) {
      const topAlbum = this.filteredAlbums[0];
      if (topAlbum.songs && topAlbum.songs.length > 0) {
        return topAlbum.songs.some(
          (s) => String(s.id) === String(this.currentTrack?.id),
        );
      }
    }

    return false;
  }

  handlePlay(song: SongInterface) {
    const trackView =
      this.filteredTracks.find((t) => t.id === song.id) ||
      this.topAlbumSongs.find((t) => t.id === song.id);

    const cover = trackView?.coverFromAlbum || song.thumbnail || '';
    this.musicStore.playOrPause(song, [song], cover);
  }
}
