import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlbumService } from '../../services/album';
import { TopNav } from '../../components/top-nav/top-nav';
import { Slider } from '../../components/slider/slider';
import { ApiService } from '../../services/api';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TopNav, Slider],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  SongCards: any[] = [];
  hasError = false;
  errorMessage = '';

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.getAlbums().subscribe({
      next: (data) => {
        this.SongCards = data;
      },
      error: (err) => {
        this.hasError = true;
        this.errorMessage = err.message;
      }
    });
  }
}

