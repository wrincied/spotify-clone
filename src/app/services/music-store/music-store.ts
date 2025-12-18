import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  AlbumInterface,
  CategoryInterface,
  SongInterface,
} from '../../interface/models';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // 1. Добавляем хранилище для песен [cite: 2025-12-14]
  private songsSubject = new BehaviorSubject<SongInterface[]>([]);
  public songs$: Observable<SongInterface[]> = this.songsSubject.asObservable();

  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$ = this.albumsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<CategoryInterface[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    this.loadAll(); // Унифицированный метод загрузки
  }

  loadAll() {
    this.loadAlbums();
    this.loadCategories();
    this.loadSongs();
  }
  get currentAlbums(): AlbumInterface[] {
    return this.albumsSubject.value;
  }

  get currentCategories(): CategoryInterface[] {
    return this.categoriesSubject.value;
  }
  get currentSongs(): SongInterface[] {
    return this.songsSubject.value;
  }

  /**
   * Загрузка песен с исправлением структуры данных [cite: 2025-12-14]
   */
  loadSongs() {
    this.http
      .get<{ error: boolean; data: any[] }>(`${this.apiUrl}/songs`)
      .pipe(
        map((response) => {
          const rawSongs = response.data || [];
          // ТРАНСФОРМАЦИЯ: Приводим данные к интерфейсу SongInterface [cite: 2025-12-14]
          return rawSongs.map((s) => ({
            ...s,
            title: s.title || s.name || 'Unknown Track',
            artist: s.artist || s.description || 'Unknown Artist',
            url: s.url || '', // Критично для фикса ошибки startsWith
            duration: s.duration || 0,
          }));
        }),
      )
      .subscribe((data) => this.songsSubject.next(data));
  }

  // loadAlbums и loadCategories остаются как в твоем примере [cite: 2025-12-14]
  loadAlbums() {
    this.http
      .get<{ error: boolean; data: AlbumInterface[] }>(`${this.apiUrl}/albums`)
      .pipe(map((r) => r.data || []))
      .subscribe((d) => this.albumsSubject.next(d));
  }

  loadCategories() {
    this.http
      .get<{ error: boolean; data: CategoryInterface[] }>(
        `${this.apiUrl}/categories`,
      )
      .pipe(map((r) => r.data || []))
      .subscribe((d) => this.categoriesSubject.next(d));
  }
}
