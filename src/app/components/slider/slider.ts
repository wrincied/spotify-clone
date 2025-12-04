import { Component, HostListener, Input, ElementRef, ViewChild } from '@angular/core';
import { SongCard } from '../song-card/song-card';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [SongCard, CommonModule],
  templateUrl: './slider.html',
  styleUrls: ['./slider.scss'],
})
export class Slider {

  constructor(private router: Router) { }

  @Input() items: any[] = [];  // Может быть альбом или песня

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

  // ЕДИНАЯ функция навигации
  onNavigate(item: any) {
    if (item.songs) {
      // это альбом
      this.router.navigate(['/album', item.id]);
    } else {
      // это песня
      this.router.navigate(['/song', item.id]);
    }
  }


  ngOnChanges() {
    console.log("SLIDER INPUT:", this.items);
  }


}
