import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MusicStoreService } from '../../services/music-store/music-store';
import { AlbumInterface, CategoryInterface, SongInterface } from '../../interface/models';

type TrackView = SongInterface & { albumId: string; cover?: string };

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
})
export class SearchComponent implements OnChanges, OnInit {
  @Input() query = '';
  filteredAlbums: AlbumInterface[] = [];
  filteredTracks: any[] = [];

  constructor(private route: ActivatedRoute, private musicStore: MusicStoreService) {}

  ngOnInit() {
    this.musicStore.albums$.subscribe(albums => { this.runFilter(albums); });
  }

  ngOnChanges() {
    this.runFilter();
  }

  private runFilter(albums?: AlbumInterface[]) {
    const list = albums ?? this.musicStore.currentAlbums;
    if (!list || list.length === 0 || !this.query) {
      this.filteredAlbums = [];
      this.filteredTracks = [];
      return;
    }

    const term = this.query.trim().toLowerCase();
    
    // Альбомы
    this.filteredAlbums = list.filter(a => 
      a.title.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)
    );

    // Песни
    this.filteredTracks = list
      .flatMap(album => (album.songs || []).map(song => ({
          ...song,
          cover: album.cover,
          _titleLc: song.title.toLowerCase(),
          _artistLc: song.artist.toLowerCase()
      })))
      .filter(s => s._titleLc.includes(term) || s._artistLc.includes(term))
      .slice(0, 5);
  }
}
