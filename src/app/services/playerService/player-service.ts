import { Injectable, signal, computed, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http'; // <--- 1. Импорт
import { SongInterface } from '../../interface/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private injector = inject(Injector);
  private http = inject(HttpClient); // <--- 2. Инжекция клиента
  public readonly instanceId = Math.random();

  // === СИГНАЛЫ СОСТОЯНИЯ ===
  readonly currentTrack = signal<SongInterface | null>(null);
  readonly isPlaying = signal<boolean>(false);
  readonly currentTime = signal<number>(0);
  readonly duration = signal<number>(0);
  readonly isBuffering = signal<boolean>(false);
  readonly isLooping = signal<boolean>(false);
  readonly isShuffling = signal<boolean>(false);
  readonly currentCover = signal<string>('');
  readonly isExpanded = signal<boolean>(false);

  private audio = new Audio();
  private readonly API_URL = environment.apiUrl;

  // === ПУБЛИЧНЫЕ ПОТОКИ ===
  readonly currentTrack$ = toObservable(this.currentTrack, {
    injector: this.injector,
  });
  readonly isPlaying$ = toObservable(this.isPlaying, {
    injector: this.injector,
  });
  readonly currentTime$ = toObservable(this.currentTime, {
    injector: this.injector,
  });
  readonly duration$ = toObservable(this.duration, { injector: this.injector });
  readonly currentCover$ = toObservable(this.currentCover, {
    injector: this.injector,
  });
  readonly isBuffering$ = toObservable(this.isBuffering, {
    injector: this.injector,
  });
  readonly isLooping$ = toObservable(this.isLooping, {
    injector: this.injector,
  });
  readonly isShuffling$ = toObservable(this.isShuffling, {
    injector: this.injector,
  });

  readonly isVisible = computed(() => !!this.currentTrack());

  private queue = signal<SongInterface[]>([]);
  private currentIndex = signal<number>(0);

  constructor() {
    this.audio.volume = 1;
    this.audio.preload = 'metadata';
    this.initAudioListeners();
  }

  private initAudioListeners() {
    this.audio.addEventListener('play', () => this.isPlaying.set(true));
    this.audio.addEventListener('pause', () => this.isPlaying.set(false));

    this.audio.addEventListener('timeupdate', () =>
      this.currentTime.set(this.audio.currentTime),
    );

    // === 3. ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ ===
    this.audio.addEventListener('loadedmetadata', () => {
      const realDuration = this.audio.duration;
      this.duration.set(realDuration);

      const currentSong = this.currentTrack();

      // Если песня загружена, но в базе у нее 0, и мы получили валидное число
      if (
        currentSong &&
        (currentSong.duration === 0 || !currentSong.duration) &&
        isFinite(realDuration) &&
        realDuration > 0
      ) {
        // Округляем до целого и отправляем на сервер
        this.updateSongDurationOnServer(
          currentSong.id,
          Math.round(realDuration),
        );
      }
    });

    this.audio.addEventListener('waiting', () => this.isBuffering.set(true));
    this.audio.addEventListener('playing', () => this.isBuffering.set(false));

    this.audio.addEventListener('error', () => {
      console.error('Audio Element Error:', this.audio.error);
      this.isBuffering.set(false);
      this.isPlaying.set(false);
    });

    this.audio.addEventListener('ended', () => {
      if (this.isLooping()) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.nextTrack();
      }
    });
  }

  // === 4. НОВЫЙ МЕТОД ОБНОВЛЕНИЯ ===
  private updateSongDurationOnServer(songId: string, duration: number) {
    // Отправляем PATCH запрос (предполагаем, что такой роут есть)
    this.http.patch(`${this.API_URL}/songs/${songId}`, { duration }).subscribe({
      next: () => {
        console.log(`[Player] Duration auto-fixed for ${songId}: ${duration}s`);

        // Обновляем локальную модель, чтобы не отправлять запрос снова при повторном плее
        this.currentTrack.update((track) => {
          if (track && track.id === songId) {
            return { ...track, duration: duration };
          }
          return track;
        });
      },
      error: (err) =>
        console.error('[Player] Failed to auto-update duration:', err),
    });
  }

  play(song: SongInterface, coverUrl?: string) {
    const current = this.currentTrack();
    if (current && String(current.id) === String(song.id)) {
      this.togglePlay();
      return;
    }
    if (!song.url) return;

    this.audio.pause();
    this.currentTrack.set(song);
    this.currentCover.set(coverUrl || song.thumbnail || '');
    this.isBuffering.set(true);

    let fullUrl: string;

    if (song.url.startsWith('http')) {
      fullUrl = song.url;
    } else {
      const cleanPath = song.url.replace(/^\/+/, '');
      fullUrl = `${environment.baseUrl}/${cleanPath}`;
    }

    console.log('[DEBUG] Loading Audio URL:', fullUrl);

    this.audio.src = fullUrl;
    this.audio.load();

    const playWhenReady = () => {
      this.audio.play().catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Real Playback Error:', err);
        this.isPlaying.set(false);
        this.isBuffering.set(false);
      });
      this.audio.removeEventListener('canplaythrough', playWhenReady);
    };

    this.audio.addEventListener('canplaythrough', playWhenReady);
  }

  togglePlay() {
    if (!this.currentTrack()) return;
    this.audio.paused ? this.audio.play() : this.audio.pause();
  }

  toggleExpanded(state: boolean) {
    this.isExpanded.set(state);
    if (state) {
      document.body.classList.add('fullscreen-mode-active');
    } else {
      document.body.classList.remove('fullscreen-mode-active');
    }
  }

  playTrackList(
    tracks: SongInterface[],
    startIndex: number = 0,
    coverUrl: string = '',
  ) {
    if (!tracks || tracks.length === 0) return;
    this.queue.set(tracks);
    this.currentIndex.set(startIndex);
    this.play(tracks[startIndex], coverUrl);
  }

  nextTrack() {
    const q = this.queue();
    if (q.length === 0) return;

    let nextIdx: number;

    if (this.isShuffling()) {
      do {
        nextIdx = Math.floor(Math.random() * q.length);
      } while (q.length > 1 && nextIdx === this.currentIndex());
    } else {
      nextIdx = this.currentIndex() + 1;
    }

    if (nextIdx < q.length) {
      this.currentIndex.set(nextIdx);
      this.play(q[nextIdx]);
    } else {
      this.isPlaying.set(false);
    }
  }

  prevTrack() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
    } else if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
      this.play(this.queue()[this.currentIndex()]);
    }
  }

  seekTo(time: number) {
    if (!isNaN(this.audio.duration)) this.audio.currentTime = time;
  }

  setVolume(vol: number) {
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }

  toggleLoop() {
    this.isLooping.update((v) => !v);
  }

  toggleShuffle() {
    this.isShuffling.update((v) => !v);
  }
}
