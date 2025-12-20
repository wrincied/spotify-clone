import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common'; // 1. Импортируем Location
import { SpotifyService } from '../../services/spotifyService/spotify-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './top-nav.html',
  styleUrls: ['./top-nav.scss'],
})
export class TopNavComponent implements OnInit {
  query = '';
  constructor(
    private router: Router,
    private location: Location,
    private spotifyService: SpotifyService,
  ) {}
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
    // Мобильная страница, где есть и Login, и Sign Up
    this.router.navigate(['/auth']);
  }
  goToHome() {
    this.spotifyService.clearSearch();
    this.router.navigate(['/']);
  }
}
