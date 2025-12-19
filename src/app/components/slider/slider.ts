import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { albumCard } from '../albumCard/albumCard';
import { AlbumInterface, CategoryInterface } from '../../interface/models';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [albumCard, CommonModule],
  templateUrl: './slider.html',
  styleUrls: ['./slider.scss'],
})
export class Slider implements AfterViewInit, OnChanges, OnDestroy {
  @Input() album: AlbumInterface[] = [];
  @Input() category: CategoryInterface[] = [];

  // Ссылка на div-контейнер, который скроллится
  @ViewChild('slider', { static: false })
  slider!: ElementRef<HTMLDivElement>;

  // Инжектим зону для оптимизации производительности
  private zone = inject(NgZone);

  showLeftBtn = false;
  showRightBtn = false;

  ngAfterViewInit() {
    // ВАЖНО: Подписываемся на скролл вне зоны Angular [cite: 2025-12-14]
    // Это предотвращает лишние циклы Change Detection на каждое движение колеса
    this.zone.runOutsideAngular(() => {
      if (this.slider && this.slider.nativeElement) {
        this.slider.nativeElement.addEventListener('wheel', this.onWheel, {
          passive: false, // Разрешаем preventDefault()
        });
      }
    });
  }

  ngOnChanges() {
    this.hideButtons();
  }

  ngOnDestroy() {
    // Обязательно удаляем слушатель, чтобы избежать утечек памяти
    if (this.slider && this.slider.nativeElement) {
      this.slider.nativeElement.removeEventListener('wheel', this.onWheel);
    }
  }

  /**
   * УМНЫЙ СКРОЛЛ (Smart Wheel Handler)
   * 1. Если это тачпад — разрешаем нативный скролл (он плавный и инерционный).
   * 2. Если это мышь (вертикальное колесо) — блокируем скролл страницы и крутим слайдер горизонтально.
   */
  private onWheel = (e: WheelEvent) => {
    // Эвристика для определения Тачпада:
    // Тачпады обычно шлют deltaMode 0 (пиксели) и маленькие значения deltaY (< 50)
    const isTouchpad = Math.abs(e.deltaY) < 50 && e.deltaMode === 0;

    // Если это тачпад или горизонтальный скролл (например, shift + wheel) — выходим.
    // Пусть браузер обрабатывает это нативно.
    if (isTouchpad || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    // Если это вертикальный скролл МЫШКОЙ:
    if (e.deltaY !== 0) {
      // 1. Останавливаем прокрутку страницы вниз
      e.preventDefault();

      // 2. Сами крутим слайдер вбок (транслируем Y в X)
      if (this.slider && this.slider.nativeElement) {
        this.slider.nativeElement.scrollLeft += e.deltaY;

        // Опционально: можно добавить логику обновления кнопок, но лучше это делать через debounce
      }
    }
  };

  // --- ЛОГИКА КНОПОК И МЫШИ (Оставлена без изменений, она корректна) ---

  onMouseMove(e: MouseEvent) {
    if (!this.slider) return;
    const el = this.slider.nativeElement;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    const canScrollLeft = el.scrollLeft > 0;
    const canScrollRight =
      Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;

    if (x < width / 2) {
      this.showLeftBtn = canScrollLeft;
      this.showRightBtn = false;
    } else {
      this.showLeftBtn = false;
      this.showRightBtn = canScrollRight;
    }
  }

  hideButtons() {
    this.showLeftBtn = false;
    this.showRightBtn = false;
  }

  scrollLeft(container: HTMLElement) {
    container.scrollBy({
      left: -250,
      behavior: 'smooth',
    });
    setTimeout(() => this.updateButtonStateAfterScroll(container), 350);
  }

  scrollRight(container: HTMLElement) {
    container.scrollBy({
      left: 250,
      behavior: 'smooth',
    });
    setTimeout(() => this.updateButtonStateAfterScroll(container), 350);
  }

  private updateButtonStateAfterScroll(el: HTMLElement) {
    const canScrollLeft = el.scrollLeft > 0;
    const canScrollRight =
      Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;

    if (this.showLeftBtn && !canScrollLeft) this.showLeftBtn = false;
    if (this.showRightBtn && !canScrollRight) this.showRightBtn = false;
  }
}
