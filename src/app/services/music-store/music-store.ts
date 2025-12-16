import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  AlbumInterface,
  CategoryInterface,
  SongInterface,
} from '../../interface/models';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
  private apiUrl = 'http://localhost:3000/api';
  private audio = new Audio();

  // ==========================================
  // 📦 DATA STATE
  // ==========================================
  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$: Observable<AlbumInterface[]> =
    this.albumsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<CategoryInterface[]>([]);
  public categories$: Observable<CategoryInterface[]> =
    this.categoriesSubject.asObservable();

  // ==========================================
  // 🎵 PLAYER STATE
  // ==========================================

  private playlist: SongInterface[] = [];
  private currentTrackIndex: number = -1;
  private currentContextCover: string = '';

  public currentTrackSubject = new BehaviorSubject<SongInterface | null>(null);
  public currentTrack$ = this.currentTrackSubject.asObservable();

  private currentCoverSubject = new BehaviorSubject<string>('');
  public currentCover$ = this.currentCoverSubject.asObservable();

  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  public isPlaying$ = this.isPlayingSubject.asObservable();

  private currentTimeSubject = new BehaviorSubject<number>(0);
  public currentTime$ = this.currentTimeSubject.asObservable();

  private durationSubject = new BehaviorSubject<number>(0);
  public duration$ = this.durationSubject.asObservable();

  private isBufferingSubject = new BehaviorSubject<boolean>(false);
  public isBuffering$ = this.isBufferingSubject.asObservable();

  private isLoopingSubject = new BehaviorSubject<boolean>(false);
  public isLooping$ = this.isLoopingSubject.asObservable();
  constructor(private http: HttpClient) {
    this.audio.preload = 'metadata';
    this.initAudioEvents();
    this.loadAlbums();
    this.loadCategories();

    this.audio.onplay = () => this.isPlayingSubject.next(true);
    this.audio.onpause = () => this.isPlayingSubject.next(false);
    this.audio.onended = () => {
      this.isPlayingSubject.next(false);
      // ЛОГИКА: если зацикливание включено, переключаем на текущий трек
      if (this.isLoopingSubject.value) {
        this.loadCurrentTrack(); // Загружает текущий трек заново
      } else {
        this.nextTrack(); // Иначе - следующий трек
      }
    };
  }

  // --- ВОССТАНОВЛЕННЫЕ ГЕТТЕРЫ (для Home/Search) ---
  get currentAlbums(): AlbumInterface[] {
    return this.albumsSubject.value;
  }
  get currentCategories(): CategoryInterface[] {
    return this.categoriesSubject.value;
  }

  // ==========================================
  // 🎮 PLAYER LOGIC
  // ==========================================

  /**
   * Умный метод: Пауза или Новый трек
   */
  playOrPause(song: SongInterface, songs: SongInterface[], coverUrl: string) {
    const current = this.currentTrackSubject.value;
    // Сравниваем ID как строки
    if (current && String(current.id) === String(song.id)) {
      this.togglePlay();
    } else {
      const index = songs.findIndex((s) => String(s.id) === String(song.id));
      if (index !== -1) {
        this.playPlaylist(songs, index, coverUrl);
      }
    }
  }

  // --- ВОССТАНОВЛЕННЫЙ setTrack (для совместимости) ---
  setTrack(song: SongInterface, coverUrl: string) {
    // Используем новую логику, чтобы работала пауза
    this.playOrPause(song, [song], coverUrl);
  }

  playPlaylist(songs: SongInterface[], startIndex: number, coverUrl: string) {
    this.playlist = songs;
    this.currentTrackIndex = startIndex;
    this.currentContextCover = coverUrl;
    this.loadCurrentTrack();
  }

  togglePlay() {
    if (this.audio.paused) {
      if (this.currentTrackSubject.value) {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => this.isPlayingSubject.next(true))
            .catch(() => this.isPlayingSubject.next(false));
        }
      }
    } else {
      this.audio.pause();
      this.isPlayingSubject.next(false);
    }
  }

  nextTrack() {
    if (this.currentTrackIndex < this.playlist.length - 1) {
      this.currentTrackIndex++;
      this.loadCurrentTrack();
    } else {
      this.pause();
    }
  }

  prevTrack() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
    } else if (this.currentTrackIndex > 0) {
      this.currentTrackIndex--;
      this.loadCurrentTrack();
    }
  }

  seekTo(time: number) {
    if (!isNaN(this.audio.duration)) this.audio.currentTime = time;
  }

  setVolume(vol: number) {
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }
  toggleLoop() {
    const currentState = this.isLoopingSubject.value;
    const newState = !currentState;
    this.isLoopingSubject.next(newState);
    // Привязываем свойство loop аудио-элемента к состоянию
    this.audio.loop = newState;
  }
  private pause() {
    this.audio.pause();
    this.isPlayingSubject.next(false);
  }

  private loadCurrentTrack() {
    const song = this.playlist[this.currentTrackIndex];
    if (!song || !song.url) return;

    const baseUrl = this.apiUrl.replace('/api', '/');
    const STATIC_PATH = 'public/music/';

    // COVER
    let coverUrl: string = song.thumbnail || this.currentContextCover || '';
    if (coverUrl && !coverUrl.startsWith('http')) {
      const cleanPath = coverUrl.startsWith('/') ? coverUrl.slice(1) : coverUrl;
      coverUrl = `${baseUrl}${cleanPath}`;
    }
    this.currentCoverSubject.next(coverUrl);

    // AUDIO
    let fullUrl: string;
    if (song.url.startsWith('http')) {
      fullUrl = song.url.replace('https://', 'http://');
    } else if (song.url.startsWith('public/')) {
      fullUrl = `${baseUrl}${song.url}`;
    } else {
      fullUrl = `${baseUrl}${STATIC_PATH}${song.url}`;
    }

    this.currentTrackSubject.next(song);
    this.audio.src = fullUrl;
    this.audio.load();
    this.audio
      .play()
      .then(() => this.isPlayingSubject.next(true))
      .catch(() => this.isPlayingSubject.next(false));
  }

  private initAudioEvents() {
    this.audio.ontimeupdate = () =>
      this.currentTimeSubject.next(this.audio.currentTime);
    this.audio.onloadedmetadata = () =>
      this.durationSubject.next(this.audio.duration);
    this.audio.onwaiting = () => this.isBufferingSubject.next(true);
    this.audio.onplaying = () => this.isBufferingSubject.next(false);
  }

  loadAlbums() {
    this.http
      .get<{
        error: boolean;
        data: AlbumInterface[];
      }>(`${this.apiUrl}/albums`)
      .pipe(map((r) => r.data || []))
      .subscribe((d) => this.albumsSubject.next(d));
  }

  loadCategories() {
    this.http
      .get<{
        error: boolean;
        data: CategoryInterface[];
      }>(`${this.apiUrl}/categories`)
      .pipe(map((r) => r.data || []))
      .subscribe((d) => this.categoriesSubject.next(d));
  }
}
