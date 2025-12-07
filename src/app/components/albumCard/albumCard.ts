import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-albumCard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './albumCard.html',
  styleUrls: ['./albumCard.scss'],
})
export class albumCard {

  @Input() title!: string;
  @Input() description!: string;
  @Input() playlistThumbnail: string | null = null;

  @Output() select = new EventEmitter<void>();

  onClick() {
    this.select.emit();
  }

  isError = false;


  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/no-image.jpg';
  }

  ngOnChanges() {
    if (!this.playlistThumbnail) {
      this.isError = true;
    }
  }
  ngOnInit() { }
  constructor(private router: Router) {

  }

}
