import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { User } from 'firebase/auth';

import { SpotifySidebar } from './components/spotify-sidebar/spotify-sidebar';
import { TopNavComponent } from './components/top-nav/top-nav';
import { HomeComponent } from './pages/home/home';
import { SearchComponent } from './pages/search/search';

import { SpotifyService } from './services/spotifyService/spotify-service';
import { MusicStoreService } from './services/music-store/music-store';
import { filter, map, Observable } from 'rxjs';
import { PlayerComponent } from './components/player/player';
import { SongInterface } from './interface/models';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SpotifySidebar, TopNavComponent, RouterModule, PlayerComponent,AsyncPipe],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit {
  searchQuery = '';
  user: User | null = null;
  currentView: 'home' | 'search' = 'home';
  isNoLayout: boolean = false;
  isPlayerVisible$: Observable<boolean>;
  constructor(
    private spotifyService: SpotifyService,
    private musicStore: MusicStoreService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
    this.isPlayerVisible$ = this.musicStore.currentTrack$.pipe(
      map((track) => !!track), // Превращаем объект трека в boolean
    );
  }

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
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Проверяем текущий маршрут на наличие флага noLayout
        let currentRoute = this.router.routerState.root;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }
        this.isNoLayout = currentRoute.snapshot.data['noLayout'] === true;
      });
  }
  goHome() {
    this.spotifyService.setSearch('');
  }
}
