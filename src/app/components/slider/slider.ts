import { Component, HostListener, Input, ElementRef, ViewChild } from '@angular/core';
import { SongCard } from '../song-card/song-card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [SongCard, CommonModule],
  templateUrl: './slider.html',
  styleUrls: ['./slider.scss'],
})
export class Slider {

  @Input() items: any[] = [];
  @ViewChild('track', { static: true }) track!: ElementRef<HTMLDivElement>;

  scrollLeft(container: HTMLElement) {
    container.scrollTo({
      left: container.scrollLeft - 250,
      behavior: 'smooth'
    });
  }

  scrollRight(container: HTMLElement) {
    container.scrollTo({
      left: container.scrollLeft + 250,
      behavior: 'smooth'
    });
  }
  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
    }
  }

  // scrollHorizontally(event: WheelEvent) {
  //   event.preventDefault();
  //   const el = event.currentTarget as HTMLElement;
  //   el.scrollLeft += event.deltaY;
  // }
}
