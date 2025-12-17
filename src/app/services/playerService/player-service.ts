import { Injectable, signal, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop'; // 👈 Важно для совместимости
import { SongInterface } from '../../interface/models';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  
  // === 1. STATE (СИГНАЛЫ) ===
  // Используем Signals для хранения состояния — это быстро и реактивно
  readonly currentTrack = signal<SongInterface | null>(null);
  readonly isPlaying = signal<boolean>(false);
  
  // Очередь воспроизведения (понадобится для переключения треков)
  private queue = signal<SongInterface[]>([]);
  private currentIndex = signal<number>(0);

  // === 2. PUBLIC API (АДАПТЕРЫ) ===
  // Твой PageArtistComponent ждет Observables, чтобы использовать combineLatest.
  // Мы превращаем сигналы в потоки:
  
  readonly currentTrack$ = toObservable(this.currentTrack);
  readonly isPlaying$ = toObservable(this.isPlaying);

  // Вычисляем видимость для App Component (плеер виден, если есть трек)
  readonly isVisible = computed(() => !!this.currentTrack());

  // === 3. ЛОГИКА ===

  /**
   * Метод, который вызывает кнопка "Play" на странице артиста
   */
  playTrackList(tracks: SongInterface[], startIndex: number = 0) {
    if (!tracks.length) return;

    // 1. Обновляем состояние
    this.queue.set(tracks);
    this.currentIndex.set(startIndex);
    
    // 2. Ставим текущий трек
    const trackToPlay = tracks[startIndex];
    this.currentTrack.set(trackToPlay);
    
    // 3. Запускаем
    this.setPlaying(true);
    
    console.log('Запущен список треков. Играет:', trackToPlay.title);
    // TODO: Здесь подключим new Audio(trackToPlay.url)
  }

  togglePlay() {
    // Инвертируем значение сигнала
    this.setPlaying(!this.isPlaying());
  }

  setPlaying(state: boolean) {
    this.isPlaying.set(state);
    
    // TODO: Управление реальным аудио:
    // if (state) audio.play() else audio.pause()
  }

  nextTrack() {
    // Логика следующего трека
    const nextIndex = this.currentIndex() + 1;
    const queue = this.queue();
    
    if (nextIndex < queue.length) {
      this.playTrackList(queue, nextIndex);
    } else {
      this.setPlaying(false); // Конец списка
    }
  }

  close() {
    this.setPlaying(false);
    this.currentTrack.set(null);
  }
}