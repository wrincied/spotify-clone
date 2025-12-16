// src/app/services/player.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { SongInterface } from '../../interface/models'; // 👈 Проверьте путь к файлу

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  // Сигнал теперь строго типизирован: либо ваша песня, либо null
  readonly currentSong = signal<SongInterface | null>(null);

  // Вычисляем видимость: если currentSong не null — показываем плеер
  readonly isVisible = computed(() => !!this.currentSong());

  // Метод принимает строго SongInterface
  play(song: SongInterface) {
    this.currentSong.set(song);
    console.log('Играет:', song);
    // Тут логика запуска аудио (Audio API)
  }

  close() {
    this.currentSong.set(null);
  }
}