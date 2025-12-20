import { Injectable, signal, computed, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { SongInterface } from '../../interface/models';

@Injectable({
  providedIn: 'root',
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
  readonly isLooping = signal<boolean>(false); // Повтор одного трека
  readonly isShuffling = signal<boolean>(false); // <--- НОВЫЙ СИГНАЛ (Shuffle)
  readonly currentCover = signal<string>('');

  private audio = new Audio();
  private readonly API_URL = 'http://localhost:3000/';

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
  }); // <--- ПОТОК

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
    this.audio.addEventListener('loadedmetadata', () =>
      this.duration.set(this.audio.duration),
    );
    this.audio.addEventListener('waiting', () => this.isBuffering.set(true));
    this.audio.addEventListener('playing', () => this.isBuffering.set(false));

    // Логика окончания трека
    this.audio.addEventListener('ended', () => {
      if (this.isLooping()) {
        // Если включен повтор одной песни
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        // Иначе переключаем
        this.nextTrack();
      }
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

    let fullUrl: string;
    if (song.url.startsWith('http')) {
      fullUrl = song.url;
    } else {
      const cleanPath = song.url
        .replace(/^\/+/, '')
        .replace(/^public\//, '')
        .replace(/^music\//, '');
      fullUrl = `${this.API_URL}public/music/${cleanPath}`;
    }

    this.audio.src = fullUrl;
    this.audio.load();
    this.audio.play().catch((err) => {
      console.error('Playback Error:', err);
      this.isPlaying.set(false);
    });
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

  // --- ОБНОВЛЕННАЯ ЛОГИКА СЛЕДУЮЩЕГО ТРЕКА ---
  nextTrack() {
    const q = this.queue();
    if (q.length === 0) return;

    let nextIdx: number;

    // Если включен Shuffle
    if (this.isShuffling()) {
      // Генерируем случайный индекс
      // Если треков > 1, стараемся не выбирать текущий трек повторно
      do {
        nextIdx = Math.floor(Math.random() * q.length);
      } while (q.length > 1 && nextIdx === this.currentIndex());
    } else {
      // Обычный порядок
      nextIdx = this.currentIndex() + 1;
    }

    // Проверка границ (для обычного порядка) или воспроизведение (для Shuffle)
    if (nextIdx < q.length) {
      this.currentIndex.set(nextIdx);
      this.play(q[nextIdx]);
    } else {
      // Конец списка (только если не Shuffle и не Loop)
      this.isPlaying.set(false);
    }
  }

  prevTrack() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
    } else if (this.currentIndex() > 0) {
      // Тут можно оставить логику "предыдущий по списку",
      // даже если включен шафл, это ожидаемое поведение (вернуться назад по истории),
      // но для простоты пока просто уменьшаем индекс
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

  // --- НОВЫЙ МЕТОД ---
  toggleShuffle() {
    this.isShuffling.update((v) => !v);
  }
}
