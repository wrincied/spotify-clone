import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FitText } from '../../directives/fit-text';
import { AlbumInterface } from '../../interface/models';

@Component({
  selector: 'app-albumCard',
  standalone: true,
  imports: [CommonModule, RouterLink, FitText],
  templateUrl: './albumCard.html',
  styleUrls: ['./albumCard.scss'],
})
export class albumCard implements OnInit, OnChanges {
  // === INPUTS ===
  @Input() title!: string;
  @Input() description!: string;
  @Input() playlistThumbnail: string | null = null;
  @Input() backgroundColor?: string;
  @Input() isTopResult: boolean = false;
  @Input() fixedSize: boolean = false;
  // Добавляем этот Input, чтобы родитель (Search) мог сказать: "Ты сейчас играешь, покажи паузу!"
  @Input() isPlaying: boolean = false;
  // Ссылка для роутера (например ['/album', '123'])
  @Input() link!: string | any[];
  @Input() releaseYear?: string;

  // === OUTPUTS ===
  @Output() playRequest = new EventEmitter<void>();

  // === STATE ===
  isError = false;

  constructor(private router: Router) {}

  ngOnInit() {}

  ngOnChanges() {
    if (!this.playlistThumbnail) {
      this.isError = true;
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://placehold.co/600x400/png';
  }

  /**
   * Обрабатывает клик по зеленой кнопке Play.
   * Останавливает всплытие, чтобы не сработал переход по ссылке (routerLink),
   * и сообщает родителю о намерении воспроизведения.
   */
  handlePlay(event: Event) {
    event.preventDefault(); // На всякий случай блокируем стандартное действие
    event.stopPropagation(); // Блокируем всплытие к тегу <a>
    this.playRequest.emit();
  }
  getYear(): string | null {
    // 1. Проверяем наличие явной даты
    if (this.releaseYear) {
      return this.releaseYear;
    }
    // 2. Попытка извлечь год из описания (Regex) [cite: 2025-12-14]
    if (this.description) {
      const yearMatch = this.description.match(/\d{4}/);
      if (yearMatch) return yearMatch[0];
    }

    return null; // Возвращаем null, чтобы скрыть элемент в UI
  }
}
