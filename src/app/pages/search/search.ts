import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MusicStoreService } from '../../services/music-store/music-store';
import { AlbumInterface, SongInterface } from '../../interface/models';
import { albumCard } from '../../components/albumCard/albumCard';
import { SongRow } from '../../components/songRow/songRow';

type TrackView = SongInterface & {
  albumId: string;
  coverFromAlbum: string | null;
};

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule, SongRow, albumCard],
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
})
export class SearchComponent implements OnInit, OnChanges {
  @Input() query = '';
  @Input() items: AlbumInterface[] = [];
  filteredAlbums: AlbumInterface[] = [];

  filteredTracks: TrackView[] = [];
  topAlbumSongs: TrackView[] = [];
  topTrack: TrackView | null = null;

  constructor(
    private route: ActivatedRoute,
    private musicStore: MusicStoreService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const q = (params['q'] ?? '').toString();
      if (q !== this.query) {
        this.query = q;
        this.runFilter();
      }
    });

    this.musicStore.albums$.subscribe((albums) => {
      this.runFilter(albums);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['query']) {
      this.runFilter();
    }
  }

  private runFilter(albums?: AlbumInterface[]): void {
    const list = albums ?? this.musicStore.currentAlbums;

    // Сброс состояний
    this.topTrack = null;
    this.filteredAlbums = [];
    this.filteredTracks = [];
    this.topAlbumSongs = [];

    if (!list || list.length === 0) return;

    const term = (this.query || '').trim().toLowerCase();
    if (!term) return;

    // 1. Все треки
    const allTracks = list.flatMap<TrackView>((album) =>
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

    // 3. Песни (предварительный поиск)
    const matchingTracks = allTracks.filter((track) => {
      const title = (track.title || '').toLowerCase();
      const artist = (track.artist || '').toLowerCase();
      return title.includes(term) || artist.includes(term);
    });

    // 4. Логика TOP TRACK (Изменено для лучшей работы)
    // Сначала ищем идеальное совпадение, если нет - берем первый трек, который начинается с запроса
    let bestMatch = matchingTracks.find(
      (t) => (t.title || '').toLowerCase() === term,
    );

    // Если строгого совпадения нет, но есть треки, и мы явно ищем не альбом (альбомов мало или нет),
    // можно взять первый наиболее релевантный трек.
    if (
      !bestMatch &&
      matchingTracks.length > 0 &&
      this.filteredAlbums.length === 0
    ) {
      bestMatch = matchingTracks[0];
    }

    if (bestMatch) {
      this.topTrack = bestMatch;
      // Исключаем топ-трек из общего списка справа
      this.filteredTracks = matchingTracks
        .filter((t) => t.id !== bestMatch!.id)
        .slice(0, 5);
    } else {
      this.topTrack = null;
      this.filteredTracks = matchingTracks.slice(0, 5);
    }

    // 5. Песни из топ-альбома (как было)
    const topAlbum = this.filteredAlbums[0];
    if (topAlbum) {
      this.topAlbumSongs = (topAlbum.songs || []).slice(0, 4).map((song) => ({
        ...song,
        albumId: topAlbum.id,
        coverFromAlbum: topAlbum.cover ?? null,
      }));
    }
  }
}
