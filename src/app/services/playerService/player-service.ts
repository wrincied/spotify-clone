import { Injectable, signal, computed, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { SongInterface } from '../../interface/models';
import { environment } from '../../../environments/environment';

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

    // Обработчик ошибок загрузки или воспроизведения
    this.audio.addEventListener('error', () => {
      console.error('Audio Element Error:', this.audio.error);
      this.isBuffering.set(false);
      this.isPlaying.set(false);
    });

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
    this.isBuffering.set(true); // Показываем индикатор загрузки немедленно

    let fullUrl: string;

    if (song.url.startsWith('http')) {
      // Если в БД уже полная ссылка (например, с Firebase Storage или S3) 
      fullUrl = song.url;
    } else {
      // Убираем лишние префиксы, если они есть в БД, чтобы не было дублей 
      const cleanPath = song.url.replace(/^\/+/, '');

      // Используем BASE_URL вместо API_URL для статических файлов (music/images) 
      // Гарантируем наличие одного слэша между ними 
      fullUrl = `${environment.baseUrl}/${cleanPath}`;
    }

    console.log('[DEBUG] Loading Audio URL:', fullUrl); // Поможет проверить в консоли 

    this.audio.src = fullUrl;
    this.audio.load();

    // Убираем немедленный вызов play() и заменяем его на обработчик
    const playWhenReady = () => {
      this.audio.play().catch((err) => {
        // Если запрос просто прервали (например, ты быстро кликнул другой трек)
        // то это не ошибка базы или файла, это нормальное поведение браузера.
        if (err.name === 'AbortError') {
          return; // Просто выходим, не надо логировать и менять сигналы
        }

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
    // Можно также вешать класс на body, чтобы скрыть глобальный сайдбар через CSS
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
