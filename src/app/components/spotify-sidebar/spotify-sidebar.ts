import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyService } from '../../services/spotifyService/spotify-service';

@Component({
  selector: 'app-spotify-sidebar',
  imports: [],
  templateUrl: './spotify-sidebar.html',
  styleUrl: './spotify-sidebar.scss',
})
export class SpotifySidebar {
  @Input() isActiveSearch = false;
  constructor(
    private spotifyService: SpotifyService,
    private router: Router,
  ) {}

  goToHome() {
    this.spotifyService.clearSearch();
    this.router.navigate(['/']);
  }
  goToLibrary() {
    this.spotifyService.clearSearch();
    this.router.navigate(['/library']);
  }
  goToSearch() {
    this.router.navigate(['/search']);
  }
  goToCreatePlaylist() {
    this.spotifyService.clearSearch();
    this.router.navigate(['/create-playlist']);
  }
}
