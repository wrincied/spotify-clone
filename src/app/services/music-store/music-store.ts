import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { ApiService } from '../ApiService/api';
import { AlbumInterface, CategoryInterface } from '../../interface/models';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
 // Адрес твоего локального бэкенда
  private apiUrl = 'http://localhost:3000/api';

  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$ = this.albumsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAlbums();
  }

  // Геттер для получения текущего значения (snapshot) данных
  get currentAlbums() {
    return this.albumsSubject.value;
  }

  loadAlbums() {
    // Делаем запрос к твоему серверу
    this.http.get<{ error: boolean, data: AlbumInterface[] }>(`${this.apiUrl}/albums`)
      .pipe(
        // Твой бэкенд возвращает { error: false, data: [...] }, нам нужен массив из data
        map(response => {
          if (response.error) {
            throw new Error('Backend returned error');
          }
          return response.data || [];
        })
      )
      .subscribe({
        next: (albums) => {
          console.log('✅ ALBUMS LOADED FROM BACKEND:', albums);
          this.albumsSubject.next(albums);
        },
        error: (err) => {
          console.error('❌ ERROR LOADING ALBUMS:', err);
        }
      });
  }
}
