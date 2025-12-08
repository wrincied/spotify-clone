import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AlbumInterface, CategoryInterface } from '../../interface/models';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
  private apiUrl = 'http://localhost:3000/api';

  // --- ALBUMS LOGIC (уже есть) ---
  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$: Observable<AlbumInterface[]> = this.albumsSubject.asObservable();

  // --- CATEGORIES LOGIC (НОВЫЙ БЛОК) ---
  private categoriesSubject = new BehaviorSubject<CategoryInterface[]>([]);
  public categories$: Observable<CategoryInterface[]> = this.categoriesSubject.asObservable();
  // ------------------------------------

  constructor(private http: HttpClient) {
    this.loadAlbums();
    this.loadCategories(); // Вызываем загрузку категорий при инициализации сервиса
  }

  // Геттер для получения текущего значения альбомов (корректный)
  get currentAlbums(): AlbumInterface[] {
    return this.albumsSubject.value;
  }

  // Геттер для получения текущего значения КАТЕГОРИЙ (исправлено)
  get currentCategories(): CategoryInterface[] {
    return this.categoriesSubject.value;
  }

  // Метод загрузки альбомов (оставлен без изменений)
  loadAlbums() {
    this.http.get<{ error: boolean, data: AlbumInterface[] }>(`${this.apiUrl}/albums`)
      .pipe(
        map(response => {
          if (response.error) { throw new Error('Backend returned error'); }
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

  // НОВЫЙ МЕТОД: Загрузка категорий
  loadCategories() {
    this.http.get<{ error: boolean, data: CategoryInterface[] }>(`${this.apiUrl}/categories`)
      .pipe(
        map(response => {
          if (response.error) { throw new Error('Backend returned error for categories'); }
          return response.data || [];
        })
      )
      .subscribe({
        next: (categories) => {
          console.log('✅ CATEGORIES LOADED FROM BACKEND:', categories);
          this.categoriesSubject.next(categories); // Обновляем хранилище категорий
        },
        error: (err) => {
          console.error('❌ ERROR LOADING CATEGORIES:', err);
        }
      });
  }
}