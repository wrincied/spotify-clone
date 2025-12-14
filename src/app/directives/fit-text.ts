import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  HostListener,
  OnChanges,
} from '@angular/core';

@Directive({
  selector: '[appFitText]',
})
export class FitText implements AfterViewInit, OnChanges {
  @Input() minFontSize = 16; // Минимальный размер шрифта (чтобы не стало нечитаемым)
  @Input() maxFontSize = 32; // Исходный размер

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.adjustFontSize();
  }
  ngOnChanges() {
    this.adjustFontSize();
  }
  @HostListener('window:resize')
  onResize() {
    this.adjustFontSize();
  }

  private adjustFontSize() {
    const element = this.el.nativeElement;

    // Сбрасываем до максимума перед проверкой
    let size = this.maxFontSize;
    element.style.fontSize = `${size}px`;
    element.style.whiteSpace = 'nowrap'; // Запрещаем перенос строк

    // Пока текст шире контейнера И шрифт больше минимума — уменьшаем
    while (
      element.scrollWidth > element.clientWidth &&
      size > this.minFontSize
    ) {
      size--;
      element.style.fontSize = `${size}px`;
    }
  }
}
