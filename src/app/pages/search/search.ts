import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MusicStoreService } from '../../services/music-store/music-store';
import { AlbumInterface, SongInterface } from '../../interface/models';

// Представление трека в поиске: SongInterface + id альбома + обложка альбома
type TrackView = SongInterface & {
  albumId: string;
  coverFromAlbum: string | null;
};

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
})
export class SearchComponent implements OnInit, OnChanges {
  @Input() query = '';

  filteredAlbums: AlbumInterface[] = [];
  filteredTracks: TrackView[] = []; // ← больше не any

  constructor(private route: ActivatedRoute, private musicStore: MusicStoreService) {}

  ngOnInit(): void {
    // Если нужно, подтягиваем q из URL
    this.route.queryParams.subscribe((params) => {
      const q = (params['q'] ?? '').toString();
      if (q !== this.query) {
        this.query = q;
        this.runFilter();
      }
    });

    // Как только пришли альбомы — фильтруем
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

    // Если нет данных или пустой запрос — чистим результаты
    if (!list || list.length === 0) {
      this.filteredAlbums = [];
      this.filteredTracks = [];
      return;
    }

    const term = (this.query || '').trim().toLowerCase();
    if (!term) {
      this.filteredAlbums = [];
      this.filteredTracks = [];
      return;
    }

    // ───── Альбомы ─────
    this.filteredAlbums = list.filter((album) => {
      const title = (album.title || '').toLowerCase();
      const desc = (album.description || '').toLowerCase();
      return title.includes(term) || desc.includes(term);
    });

    // ───── Песни (первые 5) ─────
    this.filteredTracks = list
      .flatMap<TrackView>((album) =>
        (album.songs || []).map((song) => ({
          // разворачиваем SongInterface на верхнем уровне
          ...song,
          albumId: album.id,
          coverFromAlbum: album.cover ?? null,
        }))
      )
      .filter((track) => {
        const title = (track.title || '').toLowerCase();
        const artist = (track.artist || '').toLowerCase();
        return title.includes(term) || artist.includes(term);
      })
      .slice(0, 5);
  }
}
