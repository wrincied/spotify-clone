import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/ApiService/api'; // Используем API для полных данных
import { AlbumInterface } from '../../interface/models';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist.html',
  styleUrls: ['./playlist.scss']
})
export class PlaylistComponent implements OnInit, OnDestroy {

  album: AlbumInterface | null = null;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // Загружаем детальную информацию (где songs — это объекты, а не ID)
    this.sub = this.api.getPlaylistById(id).subscribe({
      next: (album) => {
        this.album = album;
        console.log('FULL ALBUM DATA:', this.album);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading playlist:', err);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}