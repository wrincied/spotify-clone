import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AlbumInterface, CategoryInterface, SongInterface } from '../../interface/models';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
  private apiUrl = 'http://localhost:3000/api';
  private audio = new Audio();

  // ==========================================
  // 📦 DATA STATE
  // ==========================================
  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$: Observable<AlbumInterface[]> = this.albumsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<CategoryInterface[]>([]);
  public categories$: Observable<CategoryInterface[]> = this.categoriesSubject.asObservable();

  // ==========================================
  // 🎵 PLAYER STATE
  // ==========================================
  
  // Очередь воспроизведения
  private playlist: SongInterface[] = [];
  private currentTrackIndex: number = -1;
  private currentContextCover: string = ''; // Обложка для текущего плейлиста

  private currentTrackSubject = new BehaviorSubject<SongInterface | null>(null);
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

  constructor(private http: HttpClient) {
    this.audio.preload = 'metadata';
    this.initAudioEvents();
    this.loadAlbums();
    this.loadCategories();
  }

  get currentAlbums(): AlbumInterface[] { return this.albumsSubject.value; }
  get currentCategories(): CategoryInterface[] { return this.categoriesSubject.value; }

  // ==========================================
  // 🎮 PLAYER ACTIONS (Очередь)
  // ==========================================

  /**
   * Запускает воспроизведение списка песен (альбома/плейлиста)
   * @param songs Массив песен
   * @param startIndex Индекс песни, с которой начать
   * @param coverUrl Обложка альбома (общая для всех)
   */
  playPlaylist(songs: SongInterface[], startIndex: number, coverUrl: string) {
    this.playlist = songs;
    this.currentTrackIndex = startIndex;
    this.currentContextCover = coverUrl;
    
    this.loadCurrentTrack();
  }

  // Для совместимости с одиночным запуском (создает плейлист из 1 песни)
  setTrack(song: SongInterface, coverUrl: string) {
    this.playPlaylist([song], 0, coverUrl);
  }

  nextTrack() {
    // Если есть следующая песня
    if (this.currentTrackIndex < this.playlist.length - 1) {
      this.currentTrackIndex++;
      this.loadCurrentTrack();
    } else {
      // Конец плейлиста - останавливаем или зацикливаем (сейчас стоп)
      this.pause(); 
    }
  }

  prevTrack() {
    // Если больше 3 секунд проиграло, возвращаемся в начало трека
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
    } else if (this.currentTrackIndex > 0) {
      // Иначе переключаем на предыдущий
      this.currentTrackIndex--;
      this.loadCurrentTrack();
    }
  }

  togglePlay() {
    if (this.audio.paused) {
      if (this.currentTrackSubject.value) {
        this.audio.play();
        this.isPlayingSubject.next(true);
      }
    } else {
      this.audio.pause();
      this.isPlayingSubject.next(false);
    }
  }
  
  // Вспомогательный метод для паузы
  private pause() {
    this.audio.pause();
    this.isPlayingSubject.next(false);
  }

  seekTo(time: number) {
    if (!isNaN(this.audio.duration)) this.audio.currentTime = time;
  }

  setVolume(vol: number) {
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }

  // Внутренняя логика загрузки трека по индексу
  private loadCurrentTrack() {
    const song = this.playlist[this.currentTrackIndex];
    if (!song) return;

    // Обновляем состояние
    this.currentTrackSubject.next(song);
    this.currentCoverSubject.next(this.currentContextCover);
    this.currentTimeSubject.next(0);
    this.durationSubject.next(0);

    // Загрузка аудио
    this.audio.src = song.url;
    this.audio.load();

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => this.isPlayingSubject.next(true))
        .catch(e => {
          console.error("Play error:", e);
          this.isPlayingSubject.next(false);
        });
    }
  }

  // ==========================================
  // ⚙️ INTERNAL EVENTS
  // ==========================================

  private initAudioEvents() {
    this.audio.ontimeupdate = () => this.currentTimeSubject.next(this.audio.currentTime);
    this.audio.onloadedmetadata = () => this.durationSubject.next(this.audio.duration);
    this.audio.onwaiting = () => this.isBufferingSubject.next(true);
    this.audio.onplaying = () => this.isBufferingSubject.next(false);
    
    // АВТОПЕРЕХОД: Когда трек закончился, зовем nextTrack
    this.audio.onended = () => {
      this.nextTrack();
    };
  }

  loadAlbums() {
    this.http.get<{ error: boolean, data: AlbumInterface[] }>(`${this.apiUrl}/albums`)
      .pipe(map(r => r.data || []))
      .subscribe(d => this.albumsSubject.next(d));
  }

  loadCategories() {
    this.http.get<{ error: boolean, data: CategoryInterface[] }>(`${this.apiUrl}/categories`)
      .pipe(map(r => r.data || []))
      .subscribe(d => this.categoriesSubject.next(d));
  }
}