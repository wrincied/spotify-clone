import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongInterface } from '../../interface/models';
import { FormatTimePipe } from '../../pipes/format-time-pipe';

@Component({
  selector: 'app-songRow',
  standalone: true,
  imports: [CommonModule, FormatTimePipe], // CommonModule нужен для [class.active]
  templateUrl: './songRow.html',
  styleUrl: './songRow.scss',
})
export class SongRow {
  // Основные данные
  @Input({ required: true }) song!: SongInterface;
  @Input() index: number = 0;
  @Input() thumbnailUrl?: string | null;
  @Input() isSearchMode: boolean = false;

  // --- НОВЫЕ ПОЛЯ ДЛЯ ПЛЕЕРА ---
  
  // Текущий трек из стора (чтобы понять, подсвечивать ли зеленым)
  @Input() currentTrack: SongInterface | null = null;
  
  // Статус воспроизведения (чтобы показать Pause вместо Play)
  @Input() isPlaying: boolean = false;

  // Событие: "Родитель, запусти этот трек!"
  @Output() playRequest = new EventEmitter<void>();

  // Хелпер: Является ли этот рядок текущим играющим треком?
  get isCurrent(): boolean {
    // Сравниваем ID (или URL, если ID нет)
    return this.currentTrack?.id === this.song.id;
  }

  // Обработчик клика по кнопке Play или по строке
  handlePlay(event: Event) {
    event.stopPropagation(); // Чтобы клик не сработал дважды (если есть вложенность)
    this.playRequest.emit();
  }
}