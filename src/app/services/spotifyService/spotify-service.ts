import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <--- ДОБАВИЛ
import { Observable, map } from 'rxjs'; // <--- ДОБАВИЛ
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  User,
} from 'firebase/auth';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  Subject,
} from 'rxjs';
import { AlbumInterface, SongInterface } from '../../interface/models'; // Убедись, что путь верный
import { environment } from '../../../environments/environment';

// Эти константы пробрасываются из сборки
declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  // ─────────────────────────────────────────────────────────────────────
  // Firebase / служебные поля
  // ─────────────────────────────────────────────────────────────────────
  private db: any;
  private auth: any;
  private appId: string;
  private user: User | null = null;

  // <--- НОВОЕ ПОЛЕ: URL твоего API --->
  private readonly API_URL = environment.apiUrl;

  // ─────────────────────────────────────────────────────────────────────
  // Глобальное состояние поиска
  // ─────────────────────────────────────────────────────────────────────
  public searchQuery$ = new BehaviorSubject<string>('');
  private searchInputSubject = new Subject<string>();

  constructor(
    private router: Router,
    private http: HttpClient, // <--- ДОБАВИЛ: HttpClient нужен для запросов к бэку
  ) {
    this.appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    this.initFirebase();
    this.handleInitialUrl();
    this.setupSearchDebounce();
  }

  // ─────────────────────────────────────────────────────────────────────
  // DATA FETCHING METHODS (НОВЫЕ МЕТОДЫ)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Получить альбом по ID и проставить albumId всем песням внутри.
   * Это нужно, чтобы из плеера можно было кликнуть на название трека
   * и перейти обратно в альбом.
   */
  getAlbumById(id: string): Observable<AlbumInterface> {
    return this.http
      .get<{
        error: boolean;
        data: AlbumInterface;
      }>(`${this.API_URL}/albums/${id}`)
      .pipe(
        map((response) => {
          const album = response.data;

          if (album.songs && album.songs.length > 0) {
            // Явно приводим к SongInterface[], так как бэкенд теперь возвращает populated данные
            const populatedSongs = (album.songs as any[]).map((song) => ({
              ...song,
              albumId: song.albumId || album.id,
              thumbnail:
                song.thumbnail || album.cover || (album as any).thumbnail,
            }));

            // Присваиваем обратно как SongInterface[]
            album.songs = populatedSongs as SongInterface[];
          }
          return album;
        }),
      );
  }

  // Сюда можно добавить методы getArtistById, searchSongs и т.д.

  // ─────────────────────────────────────────────────────────────────────
  // ОЧИСТКА ПОИСКА
  // ─────────────────────────────────────────────────────────────────────
  clearSearch() {
    this.searchQuery$.next('');
    this.searchInputSubject.next('');
    this.router.navigate(['/'], {
      queryParams: {},
      replaceUrl: true,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // ЧТЕНИЕ НАЧАЛЬНОГО ЗНАЧЕНИЯ ИЗ URL
  // ─────────────────────────────────────────────────────────────────────
  private handleInitialUrl() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      if (q) this.searchQuery$.next(q);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // ИНИЦИАЛИЗАЦИЯ FIREBASE
  // ─────────────────────────────────────────────────────────────────────
  private initFirebase() {
    if (typeof __firebase_config === 'undefined' || !__firebase_config) {
      console.warn(
        '[SpotifyService] Firebase config is missing; Firebase init is skipped.',
      );
      return;
    }

    try {
      const config = JSON.parse(__firebase_config);
      const app = initializeApp(config);

      this.auth = getAuth(app);
      this.db = getFirestore(app);

      const initAuth = async () => {
        if (
          typeof __initial_auth_token !== 'undefined' &&
          __initial_auth_token
        ) {
          try {
            await signInWithCustomToken(this.auth, __initial_auth_token);
          } catch {
            await signInAnonymously(this.auth);
          }
        } else {
          await signInAnonymously(this.auth);
        }
      };

      initAuth();

      onAuthStateChanged(this.auth, (user: any) => {
        this.user = user;
        if (user) {
          this.syncWithCloud(user.uid);
        }
      });
    } catch (e) {
      console.error('[SpotifyService] Firebase init error:', e);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // ЛОГИКА ПОИСКА
  // ─────────────────────────────────────────────────────────────────────
  setSearch(query: string) {
    this.searchInputSubject.next(query);
    this.searchQuery$.next(query);
  }

  private setupSearchDebounce() {
    this.searchInputSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((query) => {
        this.updateUrl(query);
        this.saveToCloud(query);
      });
  }

  private updateUrl(query: string) {
    const params = { q: query || null };
    this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private async saveToCloud(query: string) {
    if (!this.user || !this.db) return;
    const ref = doc(
      this.db,
      'artifacts',
      this.appId,
      'users',
      this.user.uid,
      'preferences',
      'playback_state',
    );
    try {
      await setDoc(ref, { lastSearchQuery: query }, { merge: true });
    } catch {}
  }

  private syncWithCloud(uid: string) {
    const ref = doc(
      this.db,
      'artifacts',
      this.appId,
      'users',
      uid,
      'preferences',
      'playback_state',
    );
    onSnapshot(ref, (snap: any) => {
      if (!snap.exists()) return;
      const val = snap.data().lastSearchQuery;
      if (val !== undefined && val !== this.searchQuery$.value) {
        const urlQ =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('q')
            : null;
        if (!urlQ) {
          this.searchQuery$.next(val);
          this.updateUrl(val);
        }
      }
    });
  }
}
