import {
    Component,
    HostListener,
    Input,
    ElementRef,
    ViewChild,
    AfterViewInit,
    OnChanges,
} from '@angular/core';
import { albumCard } from '../albumCard/albumCard';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    AlbumInterface,
    CategoryInterface,
} from '../../interface/models';

@Component({
    selector: 'app-slider',
    standalone: true,
    imports: [albumCard, CommonModule],
    templateUrl: './slider.html',
    styleUrls: ['./slider.scss'],
})
export class Slider implements AfterViewInit, OnChanges {
    constructor(private router: Router) {}

    @Input() album: AlbumInterface[] = [];
    @Input() category: CategoryInterface[] = [];

    @ViewChild('slider', { static: false })
    slider!: ElementRef<HTMLDivElement>;

    // Флаги видимости кнопок
    showLeftBtn = false;
    showRightBtn = false;

    ngAfterViewInit() {
        // Первичная проверка не требуется, кнопки появятся при наведении
    }

    ngOnChanges() {
        // Сбрасываем кнопки при изменении данных
        this.hideButtons();
    }

    // Основная логика при движении мыши
    onMouseMove(e: MouseEvent) {
        if (!this.slider) return;
        const el = this.slider.nativeElement;

        // Получаем размеры контейнера и координаты курсора
        const rect = (
            e.currentTarget as HTMLElement
        ).getBoundingClientRect();
        const x = e.clientX - rect.left; // X относительно контейнера
        const width = rect.width;

        // Проверяем возможность скролла в принципе
        const canScrollLeft = el.scrollLeft > 0;
        // Math.ceil используется для исправления багов с дробными пикселями при масштабировании
        const canScrollRight =
            Math.ceil(el.scrollLeft + el.clientWidth) <
            el.scrollWidth;

        // Логика разделения зон
        if (x < width / 2) {
            // Мышь в левой половине
            this.showLeftBtn = canScrollLeft;
            this.showRightBtn = false;
        } else {
            // Мышь в правой половине
            this.showLeftBtn = false;
            this.showRightBtn = canScrollRight;
        }
    }

    // Скрытие кнопок при уходе мыши с компонента
    hideButtons() {
        this.showLeftBtn = false;
        this.showRightBtn = false;
    }

    scrollLeft(container: HTMLElement) {
        container.scrollBy({
            left: -250,
            behavior: 'smooth',
        });
        // Небольшой таймаут, чтобы обновить состояние, если мы доскроллили до края
        setTimeout(
            () =>
                this.updateButtonStateAfterScroll(
                    container,
                ),
            350,
        );
    }

    scrollRight(container: HTMLElement) {
        container.scrollBy({
            left: 250,
            behavior: 'smooth',
        });
        setTimeout(
            () =>
                this.updateButtonStateAfterScroll(
                    container,
                ),
            350,
        );
    }

    // Проверка после клика (если дошли до края, кнопка должна исчезнуть даже под курсором)
    private updateButtonStateAfterScroll(el: HTMLElement) {
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight =
            Math.ceil(el.scrollLeft + el.clientWidth) <
            el.scrollWidth;

        if (this.showLeftBtn && !canScrollLeft)
            this.showLeftBtn = false;
        if (this.showRightBtn && !canScrollRight)
            this.showRightBtn = false;
    }

    @HostListener('wheel', ['$event'])
    onWheel(e: WheelEvent) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY))
            e.preventDefault();
    }

    onNavigate(item: any) {
        if (item.songs)
            this.router.navigate(['/album', item.id]);
        else this.router.navigate(['/song', item.id]);
    }
}
