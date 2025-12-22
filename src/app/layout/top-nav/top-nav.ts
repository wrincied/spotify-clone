import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SpotifyService } from '../../core/services/spotify-service/spotify-service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './top-nav.html',
  styleUrls: ['./top-nav.scss'],
})
export class TopNavComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly spotifyService = inject(SpotifyService);

  query = '';

  // Реактивное отслеживание текущего URL
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // Сигнал для управления видимостью истории на мобилках
  readonly showMobileHistory = computed(() => {
    const url = this.currentUrl();
    return (
      url.includes('/artist/') ||
      url.includes('/playlist/') ||
      url.includes('/album/')
    );
  });

  ngOnInit() {
    this.spotifyService.searchQuery$.subscribe((q) => {
      this.query = q;
    });
  }

  onInput(val: string) {
    this.router.navigate(['/search'], {
      queryParams: { q: val },
    });
  }

  goBack() {
    this.location.back();
  }

  goForward() {
    this.location.forward();
  }

  onNagivateToLogin() {
    this.router.navigate(['/login']);
  }

  onNavigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  onNagivateToMobileAuth() {
    this.router.navigate(['/auth']);
  }

  goToHome() {
    this.spotifyService.clearSearch();
    this.router.navigate(['/']);
  }
}
