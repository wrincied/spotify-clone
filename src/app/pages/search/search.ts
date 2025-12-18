import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  inject, // Добавили inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { MusicStoreService } from '../../services/music-store/music-store';
import { PlayerService } from '../../services/playerService/player-service'; // Импорт синглтона
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

  // Внедряем PlayerService
  private playerService = inject(PlayerService);

  filteredAlbums: AlbumInterface[] = [];
  filteredTracks: TrackWithContext[] = [];
  topAlbumSongs: TrackWithContext[] = [];
  topTrack: TrackWithContext | null = null;

  // Потоки для HTML
  currentTrack$: Observable<SongInterface | null>;
  isPlaying$: Observable<boolean>;

  // Состояние для геттера
  currentTrack: SongInterface | null = null;
  isPlaying: boolean = false;

  private subs: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private musicStore: MusicStoreService,
    private router: Router,
  ) {
    // ИСТОЧНИК ПРАВДЫ: Теперь берем всё из PlayerService
    this.currentTrack$ = this.playerService.currentTrack$;
    this.isPlaying$ = this.playerService.isPlaying$;
  }

  ngOnInit(): void {
    // URL и Альбомы (MusicStore остается только как API данных)
    this.subs.add(
      this.route.queryParams.subscribe((params) => {
        const q = (params['q'] ?? '').toString();
        if (q !== this.query) {
          this.query = q;
          this.runFilter();
        }
      }),
    );

    this.subs.add(
      this.musicStore.albums$.subscribe((albums) => {
        this.runFilter(albums);
      }),
    );

    // Подписки на состояние плеера для логики "Top Result"
    this.subs.add(
      this.currentTrack$.subscribe((track) => (this.currentTrack = track)),
    );

    this.subs.add(
      this.isPlaying$.subscribe((state) => (this.isPlaying = state)),
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

  // Метод фильтрации остается без изменений (логика данных)
  private runFilter(albums?: AlbumInterface[]): void {
    const list = albums ?? this.musicStore.currentAlbums;
    this.topTrack = null;
    this.filteredAlbums = [];
    this.filteredTracks = [];
    this.topAlbumSongs = [];

    if (!list || list.length === 0) return;

    const term = (this.query || '').trim().toLowerCase();
    if (!term) return;

    const allTracks = list.flatMap<TrackWithContext>((album) =>
      (album.songs || []).map((song) => ({
        ...song,
        albumId: album.id,
        coverFromAlbum: album.thumbnail ?? null,
      })),
    );

    this.filteredAlbums = list.filter((album) => {
      const title = (album.title || '').toLowerCase();
      const desc = (album.description || '').toLowerCase();
      return title.includes(term) || desc.includes(term);
    });

    const matchingTracks = allTracks.filter((track) => {
      const title = (track.title || '').toLowerCase();
      const artist = (track.artist || '').toLowerCase();
      return title.includes(term) || artist.includes(term);
    });

    let bestMatch = matchingTracks.find(
      (t) => (t.title || '').toLowerCase() === term,
    );

    if (!bestMatch && matchingTracks.length > 0 && this.filteredAlbums.length === 0) {
      bestMatch = matchingTracks[0];
    }

    if (bestMatch) {
      this.topTrack = bestMatch;
      this.filteredTracks = matchingTracks.filter((t) => t.id !== bestMatch!.id).slice(0, 5);
    } else {
      this.topTrack = null;
      this.filteredTracks = matchingTracks.slice(0, 5);
    }

    const topAlbum = this.filteredAlbums[0];
    if (topAlbum) {
      this.topAlbumSongs = (topAlbum.songs || []).slice(0, 4).map((song) => ({
        ...song,
        albumId: topAlbum.id,
        coverFromAlbum: topAlbum.thumbnail ?? null,
      }));
    }
  }

  get isTopResultPlaying(): boolean {
    if (!this.isPlaying || !this.currentTrack) return false;

    if (this.topTrack) {
      return String(this.currentTrack.id) === String(this.topTrack.id);
    }

    if (this.filteredAlbums.length > 0) {
      const topAlbum = this.filteredAlbums[0];
      if (topAlbum.songs) {
        return topAlbum.songs.some(
          (s) => String(s.id) === String(this.currentTrack?.id),
        );
      }
    }
    return false;
  }

  handlePlay(song: SongInterface) {
    // Находим контекст (обложку) для трека
    const trackView =
      this.filteredTracks.find((t) => t.id === song.id) ||
      this.topAlbumSongs.find((t) => t.id === song.id) ||
      (this.topTrack?.id === song.id ? this.topTrack : null);

    const cover = trackView?.coverFromAlbum || song.thumbnail || '';
    
    // ВЫЗОВ СИНГЛТОНА: Теперь управление через PlayerService
    this.playerService.play(song, cover);
  }
}