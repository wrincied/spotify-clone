import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AlbumInterface, CategoryInterface, SongInterface } from '../../interface/models'; // Убедись, что SongInterface подходит под определение трека
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
  private apiUrl = 'http://localhost:3000/api';
  
  // ==========================================
  // 🎵 AUDIO CORE
  // ==========================================
  private audio = new Audio();

  // ==========================================
  // 📦 STATE SUBJECTS (Хранилище состояния)
  // ==========================================
  
  // --- ALBUMS ---
  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$: Observable<AlbumInterface[]> = this.albumsSubject.asObservable();

  // --- CATEGORIES ---
  private categoriesSubject = new BehaviorSubject<CategoryInterface[]>([]);
  public categories$: Observable<CategoryInterface[]> = this.categoriesSubject.asObservable();

  // --- PLAYER STATE ---
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  public isPlaying$ = this.isPlayingSubject.asObservable();

  private currentTrackSubject = new BehaviorSubject<SongInterface | null>(null);
  public currentTrack$ = this.currentTrackSubject.asObservable();

  private currentTimeSubject = new BehaviorSubject<number>(0);
  public currentTime$ = this.currentTimeSubject.asObservable();

  private durationSubject = new BehaviorSubject<number>(0);
  public duration$ = this.durationSubject.asObservable();

  private isBufferingSubject = new BehaviorSubject<boolean>(false);
  public isBuffering$ = this.isBufferingSubject.asObservable();

  // Плейлист пока простой массив, можно расширить
  private playlist: SongInterface[] = [];
  private currentTrackIndex = -1;

  constructor(private http: HttpClient) {
    // Настройка Audio
    this.audio.preload = 'metadata';
    this.initAudioEvents();

    // Загрузка данных
    this.loadAlbums();
    this.loadCategories();
  }

  // ==========================================
  // ⚙️ INITIALIZATION (Слушатели аудио)
  // ==========================================
  private initAudioEvents() {
    // Обновление текущего времени
    this.audio.ontimeupdate = () => {
      this.currentTimeSubject.next(this.audio.currentTime);
    };

    // Обновление длительности при загрузке метаданных
    this.audio.onloadedmetadata = () => {
      this.durationSubject.next(this.audio.duration);
    };

    // Автопереключение при окончании
    this.audio.onended = () => {
      this.nextTrack();
    };

    // Буферизация
    this.audio.onwaiting = () => {
      this.isBufferingSubject.next(true);
    };

    // Возобновление проигрывания
    this.audio.onplaying = () => {
      this.isBufferingSubject.next(false);
    };

    // Обработка ошибок (можно добавить Subject для ошибок)
    this.audio.onerror = (e) => {
      console.error('Audio Playback Error:', e);
      this.isPlayingSubject.next(false);
      this.isBufferingSubject.next(false);
    };
  }

  // ==========================================
  // 🎮 PLAYER ACTIONS (Методы управления)
  // ==========================================

  setTrack(track: SongInterface) {
    // 1. Обновляем состояние трека
    this.currentTrackSubject.next(track);
    this.currentTimeSubject.next(0);
    this.durationSubject.next(0);
    
    // TODO: Здесь можно обновить playlist и currentTrackIndex, если трек из списка

    // 2. Загружаем и играем
    this.audio.src = track.url; // Предполагается, что в SongInterface есть поле url
    this.audio.load();
    
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlayingSubject.next(true);
        })
        .catch(error => {
          console.error("Play error:", error);
          this.isPlayingSubject.next(false);
        });
    }
  }

  togglePlay() {
    if (this.audio.paused) {
      // Если есть трек, играем
      if (this.currentTrackSubject.value) {
        this.audio.play().catch(e => console.error("Play error:", e));
        this.isPlayingSubject.next(true);
      }
    } else {
      this.audio.pause();
      this.isPlayingSubject.next(false);
    }
  }

  seekTo(time: number) {
    if (!isNaN(this.audio.duration) && this.audio.duration > 0) {
      this.audio.currentTime = time;
    }
  }

  setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  nextTrack() {
    console.log('Next track logic pending...');
    // Логика переключения по this.playlist и this.currentTrackIndex
  }

  prevTrack() {
    console.log('Previous track logic pending...');
    // Логика переключения назад
  }

  // ==========================================
  // 📥 DATA FETCHING (Существующие методы)
  // ==========================================

  get currentAlbums(): AlbumInterface[] {
    return this.albumsSubject.value;
  }

  get currentCategories(): CategoryInterface[] {
    return this.categoriesSubject.value;
  }

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
          console.log('✅ ALBUMS LOADED:', albums);
          this.albumsSubject.next(albums);
        },
        error: (err) => console.error('❌ ERROR LOADING ALBUMS:', err)
      });
  }

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
          console.log('✅ CATEGORIES LOADED:', categories);
          this.categoriesSubject.next(categories);
        },
        error: (err) => console.error('❌ ERROR LOADING CATEGORIES:', err)
      });
  }
}