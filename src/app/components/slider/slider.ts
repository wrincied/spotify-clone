import {
  Component,
  HostListener,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges
} from '@angular/core';
import { albumCard } from '../albumCard/albumCard';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlbumInterface } from '../../interface/models';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [albumCard, CommonModule],
  templateUrl: './slider.html',
  styleUrls: ['./slider.scss'],
})
export class Slider implements AfterViewInit, OnChanges {

  constructor(private router: Router) {}

  @Input() items: AlbumInterface[] = [];

  @ViewChild('slider', { static: false }) slider!: ElementRef<HTMLDivElement>;

  showButtons = false;

  ngAfterViewInit() {
    setTimeout(() => this.checkOverflow(), 0);
  }

  ngOnChanges() {
    setTimeout(() => this.checkOverflow(), 0);
  }

  private checkOverflow() {
    if (!this.slider) return;

    const el = this.slider.nativeElement;
    this.showButtons = el.scrollWidth > el.clientWidth;
  }

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
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
  }

  onNavigate(item: any) {
    if (item.songs) this.router.navigate(['/album', item.id]);
    else this.router.navigate(['/song', item.id]);
  }
}
