import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import {
  AlbumInterface,
  CategoryInterface,
  SongInterface,
} from '../../interface/models';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // Состояния через BehaviorSubject для стримов (совместимость с async pipe) [cite: 2025-12-14]
  private songsSubject = new BehaviorSubject<SongInterface[]>([]);
  public songs$ = this.songsSubject.asObservable();

  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$ = this.albumsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<CategoryInterface[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  // Сигналы для синхронного доступа (Angular 21 стандарты) [cite: 2025-12-14]
  private _songs = signal<SongInterface[]>([]);
  private _albums = signal<AlbumInterface[]>([]);
  private _categories = signal<CategoryInterface[]>([]);

  // Публичные геттеры (теперь это сигналы) [cite: 2025-12-14]
  public currentSongs = computed(() => this._songs());
  public currentAlbums = computed(() => this._albums());
  public currentCategories = computed(() => this._categories());

  constructor() {
    this.loadAll();
  }

  loadAll() {
    this.loadSongs();
    this.loadAlbums();
    this.loadCategories();
  }

  /**
   * Загрузка и нормализация песен [cite: 2025-12-14]
   */
  loadSongs() {
    this.http
      .get<{ error: boolean; data: any[] }>(`${this.apiUrl}/songs`)
      .pipe(
        map((res) =>
          (res.data || []).map(
            (s): SongInterface => ({
              ...s,
              id: s.id || Math.random().toString(36).substr(2, 9),
              title: s.title || s.name || 'Unknown Track',
              artist: s.artist || 'Unknown Artist',
              url: s.url || '',
              thumbnail: s.thumbnail || 'assets/no-album.png',
              duration: Number(s.duration) || 0,
            }),
          ),
        ),
        tap((data) => {
          this._songs.set(data);
          this.songsSubject.next(data);
        }),
      )
      .subscribe();
  }

  /**
   * Загрузка альбомов с защитой от пустых полей [cite: 2025-12-14]
   */
  loadAlbums() {
    this.http
      .get<{ error: boolean; data: any[] }>(`${this.apiUrl}/albums`)
      .pipe(
        map((res) =>
          (res.data || []).map(
            (a): AlbumInterface => ({
              ...a,
              id: a.id,
              title: a.title || 'Untitled Album',
              description: a.description || 'No description',
              cover: a.cover || a.thumbnail || 'assets/no-album.png',
              songs: Array.isArray(a.songs) ? a.songs : [], // В БД это массив ID [cite: 2025-12-18]
              artistId: a.artistId || '',
            }),
          ),
        ),
        tap((data) => {
          this._albums.set(data);
          this.albumsSubject.next(data);
        }),
      )
      .subscribe();
  }

  loadCategories() {
    this.http
      .get<{ error: boolean; data: CategoryInterface[] }>(
        `${this.apiUrl}/categories`,
      )
      .pipe(
        map((res) => res.data || []),
        tap((data) => {
          this._categories.set(data);
          this.categoriesSubject.next(data);
        }),
      )
      .subscribe();
  }
}
