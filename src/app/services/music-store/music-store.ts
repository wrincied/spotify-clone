import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '../ApiService/api';
import { AlbumInterface } from '../../interface/models';

@Injectable({
  providedIn: 'root'
})
export class MusicStoreService {
  // Хранилище состояния
  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$ = this.albumsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private api: ApiService) {}

  // Метод вызывается один раз в App или принудительно для обновления
  loadAlbums(): void {
    if (this.loadingSubject.value) return; // Защита от дублирования

    this.loadingSubject.next(true);
    
    this.api.getAlbums().subscribe({
      next: (data: AlbumInterface[]) => {
        this.albumsSubject.next(data);
        this.loadingSubject.next(false);
      },
      error: (err: any) => {
        console.error('Global Store Error:', err);
        this.loadingSubject.next(false);
      }
    });
  }

  // Получить текущее значение синхронно (если нужно)
  get currentAlbums(): AlbumInterface[] {
    return this.albumsSubject.value;
  }
}