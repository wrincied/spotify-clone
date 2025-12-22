import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import {
  AlbumInterface,
  CategoryInterface,
  SongInterface,
  ArtistInterface,
} from '../../interface/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
  private http = inject(HttpClient);
  private API_URL = environment.apiUrl;

  // Состояния через BehaviorSubject для стримов (совместимость с async pipe) 
  private songsSubject = new BehaviorSubject<SongInterface[]>([]);
  public songs$ = this.songsSubject.asObservable();

  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$ = this.albumsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<CategoryInterface[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private artistsSubject = new BehaviorSubject<any[]>([]);
  public artists$ = this.artistsSubject.asObservable();
  // Сигналы для синхронного доступа (Angular 21 стандарты) 
  private _songs = signal<SongInterface[]>([]);
  private _albums = signal<AlbumInterface[]>([]);
  private _categories = signal<CategoryInterface[]>([]);
  private _artists = signal<any[]>([]);
  // Публичные геттеры (теперь это сигналы)
  public currentSongs = computed(() => this._songs());
  public currentAlbums = computed(() => this._albums());
  public currentCategories = computed(() => this._categories());
  public currentArtists = computed(() => this._artists());

  constructor() {
    this.loadAll();
  }

  loadAll() {
    this.loadSongs();
    this.loadAlbums();
    this.loadCategories();
    this.loadArtists();
  }
    /**
   * Загрузка исполнителей 
   */
  loadArtists(){
    this.http
    .get<{ error: boolean; data: any[] }>(`${this.API_URL}/artists`)
    .pipe(
      map((res) => (res.data || []).map(art => ({
        ...art,
        id: art.id,
        name: art.name || 'Unknown Artist',
        image: art.image || 'assets/no-artist.png'
      }))),
      tap((data) => {
        this._artists.set(data);
        this.artistsSubject.next(data);
      })
    )
    .subscribe();
  }
  /**
   * Загрузка и нормализация песен 
   */
  loadSongs() {
    this.http

      .get<{ error: boolean; data: any[] }>(`${this.API_URL}/songs`)

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
              playCount:
                s.playCount ||
                Math.floor(Math.random() * (5000000 - 500000 + 1)) + 500000,
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
   * Загрузка альбомов с защитой от пустых полей 
   */
  loadAlbums() {
    this.http
      .get<{ error: boolean; data: any[] }>(`${this.API_URL}/albums`)
      .pipe(
        map((res) =>
          (res.data || []).map(
            (a): AlbumInterface => ({
              ...a,
              id: a.id,
              title: a.title || 'Untitled Album',
              description: a.description || 'No description',
              cover: a.cover || a.thumbnail || 'assets/no-album.png',
              songs: Array.isArray(a.songs) ? a.songs : [], 
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
        `${this.API_URL}/categories`,
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
