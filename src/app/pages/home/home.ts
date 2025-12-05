import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TopNav } from '../../components/top-nav/top-nav';
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
export class Home implements OnInit, OnDestroy {

  albums: AlbumInterface[] = [];
  hasError = false;
  errorMessage = '';
  private dataSubscription?: Subscription;

  constructor(
    private musicStore: MusicStoreService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Гарантируем, что загрузка началась, даже если App не успел это сделать
    this.musicStore.loadAlbums();

    // Подписываемся на поток данных из глобального хранилища
    this.dataSubscription = this.musicStore.albums$.subscribe({
      next: (albums) => {
        this.albums = albums;
        // Ошибки загрузки обрабатываются в сервисе, но можно добавить логику сюда,
        // если в сервисе появится subject для ошибок.
        this.hasError = false; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        // Сработает, если поток выбросит ошибку (обычно BehaviorSubject не выбрасывает, но для страховки)
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