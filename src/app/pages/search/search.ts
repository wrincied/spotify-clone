import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MusicStoreService } from '../../services/music-store/music-store';
import { AlbumInterface, SongInterface } from '../../interface/models';
import { albumCard } from "../../components/albumCard/albumCard";
import { SongRow } from "../../components/songRow/songRow";

// Представление трека в поиске: SongInterface + id альбома + обложка альбома
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

  filteredAlbums: AlbumInterface[] = [];
  filteredTracks: TrackView[] = []; 
  topAlbumSongs: TrackView[] = []; 

  // НОВОЕ СВОЙСТВО: Для отображения песни, которая идеально совпала с запросом
  topTrack: TrackView | null = null; 

  constructor(private route: ActivatedRoute, private musicStore: MusicStoreService) {}

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

    if (!list || list.length === 0) {
      this.filteredAlbums = [];
      this.filteredTracks = [];
      this.topAlbumSongs = [];
      this.topTrack = null; // Очистка нового свойства
      return;
    }

    const term = (this.query || '').trim().toLowerCase();
    if (!term) {
      this.filteredAlbums = [];
      this.filteredTracks = [];
      this.topAlbumSongs = [];
      this.topTrack = null; // Очистка нового свойства
      return;
    }

    // 1. ───── Извлечение и фильтрация всех треков ─────
    const allTracks = list
      .flatMap<TrackView>((album) =>
        (album.songs || []).map((song) => ({
          ...song,
          albumId: album.id,
          coverFromAlbum: album.cover ?? null,
        }))
      );

    // 2. ───── Альбомы ─────
    this.filteredAlbums = list.filter((album) => {
      const title = (album.title || '').toLowerCase();
      const desc = (album.description || '').toLowerCase();
      return title.includes(term) || desc.includes(term);
    });
    
    // 3. ───── Песни (Фильтрация и лимит 5) ─────
    const matchingTracks = allTracks.filter((track) => {
      const title = (track.title || '').toLowerCase();
      const artist = (track.artist || '').toLowerCase(); // Используем description как artist
      return title.includes(term) || artist.includes(term);
    });

    // 4. ───── Топовый Трек (Идеальное совпадение) ─────
    // Ищем трек, название которого идеально совпадает с запросом
    const perfectMatch = matchingTracks.find(t => (t.title || '').toLowerCase() === term);
    
    if (perfectMatch) {
        this.topTrack = perfectMatch;
        // Убираем топовый трек из общего списка треков
        this.filteredTracks = matchingTracks
            .filter(t => t.id !== perfectMatch.id)
            .slice(0, 5); 
    } else {
        this.topTrack = null;
        this.filteredTracks = matchingTracks.slice(0, 5);
    }
    
    // 5. ───── Топ 5 песен из наиболее подходящего альбома ─────
    this.topAlbumSongs = []; 
    const topAlbum = this.filteredAlbums[0];
    if (topAlbum) {
        this.topAlbumSongs = (topAlbum.songs || [])
            .slice(0, 4) 
            .map(song => ({
                ...song, 
                albumId: topAlbum.id,
                coverFromAlbum: topAlbum.cover ?? null,
            }));
    }
  }
}