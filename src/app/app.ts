import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from 'firebase/auth';

import { SpotifySidebar } from './components/spotify-sidebar/spotify-sidebar';
import { TopNavComponent } from './components/top-nav/top-nav';
import { HomeComponent } from './pages/home/home';
import { SearchComponent } from './pages/search/search';

import { SpotifyService } from './services/spotifyService/spotify-service';
import { MusicStoreService } from './services/music-store/music-store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SpotifySidebar, TopNavComponent, RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit {
  searchQuery = '';
  user: User | null = null;
  currentView: 'home' | 'search' = 'home';

  constructor(
    private spotifyService: SpotifyService,
    private musicStore: MusicStoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Глобальная загрузка альбомов
    this.musicStore.loadAlbums();

    // Подписка на поиск
    this.spotifyService.searchQuery$.subscribe((q) => {
      this.searchQuery = q;
      this.cdr.detectChanges();
    });
    // Сброс поиска, если нет q в URL
    const url = new URL(window.location.href);
    if (!url.searchParams.get('q')) {
      this.spotifyService.setSearch('');
    }
  }

  goHome() {
    this.spotifyService.setSearch('');
  }
}
