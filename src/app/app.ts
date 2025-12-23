import { Component, OnInit, inject } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterModule,
  ActivatedRoute,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // Essential for memory management
import { filter, map, Observable } from 'rxjs';
import { User } from 'firebase/auth';
// Components
import { SpotifySidebar } from './layout/spotify-sidebar/spotify-sidebar';
import { TopNavComponent } from './layout/top-nav/top-nav';
import { PlayerComponent } from './layout/player/player';
import { CookieConsent } from './features/cookie/cookie-consent';
// Services
import { SpotifyService } from './core/services/spotify-service/spotify-service';
import { MusicStoreService } from './core/services/music-store-service/music-store';
import { PlayerService } from './core/services/player-service/player-service';
import { AuthService } from './core/services/auth-service/auth-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SpotifySidebar, TopNavComponent, RouterModule, PlayerComponent,CookieConsent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit {
  // Dependency Injection: Using 'inject' is the modern Angular standard
  private readonly spotifyService = inject(SpotifyService);
  private readonly musicStore = inject(MusicStoreService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute); // Used instead of window.location for SSR safety

  // Public services accessed directly in the template
  public readonly playerService = inject(PlayerService);

  // State properties
  searchQuery = '';
  user: User | null = null;
  currentView: 'home' | 'search' = 'home';
  isNoLayout = false;

  // Observables
  isPlayerVisible$: Observable<boolean>;

  constructor() {
    // Initialize the player visibility stream based on current track existence
    this.isPlayerVisible$ = this.playerService.currentTrack$.pipe(
      map((track) => !!track),
    );

    // 1. Subscribe to search query changes.
    // 'takeUntilDestroyed()' automatically unsubscribes when the component is destroyed.
    // This fixes the memory leak detected by Code Assist.
    this.spotifyService.searchQuery$
      .pipe(takeUntilDestroyed())
      .subscribe((q) => {
        this.searchQuery = q;
        // Note: Manual cdr.detectChanges() removed as Angular handles binding updates automatically here.
      });

    // 2. Monitor router events to toggle the layout (Sidebar/Player visibility).
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(), // Prevents memory leaks
      )
      .subscribe(() => {
        this.checkLayoutMode();
      });
  }

  ngOnInit() {
    // Load initial data (Global albums)
    this.musicStore.loadAlbums();

    // Check authentication status on app initialization (e.g., after F5 refresh)
    // We assume checkAuthStatus handles its own subscription lifecycle or completes immediately.
    this.authService.checkAuthStatus().subscribe();

    // Check URL parameters safely without accessing 'window' object
    const queryParam = this.route.snapshot.queryParamMap.get('q');

    // If no query parameter is present, reset the search state
    if (!queryParam) {
      this.spotifyService.setSearch('');
    }
  }

  /**
   * Helper method to determine if the current route requires a "No Layout" mode (e.g., Login page).
   * Traverses the route tree to find the 'noLayout' data property.
   */
  private checkLayoutMode(): void {
    let currentRoute = this.router.routerState.root;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    this.isNoLayout = currentRoute.snapshot.data['noLayout'] === true;
  }

  /**
   * Resets the search and returns the user to the default view.
   */
  goHome() {
    this.spotifyService.setSearch('');
  }
}
