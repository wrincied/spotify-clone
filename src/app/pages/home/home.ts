import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TopNavComponent } from '../../components/top-nav/top-nav';
import { Slider } from '../../components/slider/slider';
import { MusicStoreService } from '../../services/music-store/music-store'; // Убедитесь в правильности пути
import { AlbumInterface } from '../../interface/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Slider],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  albums: AlbumInterface[] = [];
  hasError = false;
  errorMessage = '';
  private dataSubscription?: Subscription;

  constructor(
    private musicStore: MusicStoreService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.musicStore.loadAlbums();
    this.dataSubscription = this.musicStore.albums$.subscribe({
      next: (albums) => {
        this.albums = albums;
        this.hasError = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.hasError = true;
        this.errorMessage = 'Ошибка синхронизации данных';
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
  }
}