import { Injectable, signal, computed, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { SongInterface } from '../../interface/models';

@Injectable({
  providedIn: 'root', // Синглтон на уровне всего приложения
})
export class PlayerService {
  private injector = inject(Injector);
  public readonly instanceId = Math.random();

  // === СИГНАЛЫ СОСТОЯНИЯ ===
  readonly currentTrack = signal<SongInterface | null>(null);
  readonly isPlaying = signal<boolean>(false);
  readonly currentTime = signal<number>(0);
  readonly duration = signal<number>(0);
  readonly isBuffering = signal<boolean>(false);
  readonly isLooping = signal<boolean>(false);
  readonly currentCover = signal<string>('');

  private audio = new Audio();
  private readonly API_URL = 'http://localhost:3000/';

  // === ПУБЛИЧНЫЕ ПОТОКИ (для async pipe) ===
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
  // Вычисляемое свойство для рендера плеера в app.html
  readonly isVisible = computed(() => !!this.currentTrack());
  readonly isBuffering$ = toObservable(this.isBuffering, {
    injector: this.injector,
  });
  readonly isLooping$ = toObservable(this.isLooping, {
    injector: this.injector,
  });

  private queue = signal<SongInterface[]>([]);
  private currentIndex = signal<number>(0);

  constructor() {
    this.audio.volume = 1;
    this.audio.preload = 'metadata';
    this.initAudioListeners();
    console.log('!!! PlayerService Engine Started. ID:', this.instanceId);
  }

  private initAudioListeners() {
    // Синхронизация физического Audio API с Angular Signals
    this.audio.addEventListener('play', () => this.isPlaying.set(true));
    this.audio.addEventListener('pause', () => this.isPlaying.set(false));
    this.audio.addEventListener('timeupdate', () =>
      this.currentTime.set(this.audio.currentTime),
    );
    this.audio.addEventListener('loadedmetadata', () =>
      this.duration.set(this.audio.duration),
    );
    this.audio.addEventListener('waiting', () => this.isBuffering.set(true));
    this.audio.addEventListener('playing', () => this.isBuffering.set(false));
    this.audio.addEventListener('ended', () => {
      if (this.isLooping()) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.nextTrack();
      }
    });
  }

  /**
   * Умный запуск трека
   */
  play(song: SongInterface, coverUrl?: string) {
    const current = this.currentTrack();

    // 1. Детекция текущего трека (сравнение ID как строк)
    if (current && String(current.id) === String(song.id)) {
      this.togglePlay();
      return;
    }

    // 2. Подготовка нового трека
    this.audio.pause();
    this.currentTrack.set(song);

    // Приоритет обложки: переданная -> из песни -> пусто
    this.currentCover.set(coverUrl || song.thumbnail || '');

    // 3. Формирование корректного URL (логика из MusicStore)
    let fullUrl: string;
    if (song.url.startsWith('http')) {
      fullUrl = song.url;
    } else {
      const path = song.url.startsWith('public/')
        ? song.url
        : `public/music/${song.url}`;
      fullUrl = `${this.API_URL}${path}`;
    }

    this.audio.src = fullUrl;
    this.audio.load();
    this.audio.play().catch((err) => console.error('Playback Error:', err));
  }

  togglePlay() {
    if (!this.currentTrack()) return;
    this.audio.paused ? this.audio.play() : this.audio.pause();
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
    const nextIdx = this.currentIndex() + 1;
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
    if (!isNaN(this.audio.duration)) {
      this.audio.currentTime = time;
    }
  }

  setVolume(vol: number) {
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }

  toggleLoop() {
    this.isLooping.update((v) => !v);
  }
}
