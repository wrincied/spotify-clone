import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-song-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './song-card.html',
  styleUrls: ['./song-card.scss'],
})
export class SongCard {

  @Input() playlistThumbnail: string | null = null;

  @Input() title!: string;
  @Input() description!: string;

  isError = false;


  onError() {
    this.isError = true;
  }
  ngOnChanges() {
    if (!this.playlistThumbnail) {
      this.isError = true;
    }
  }


}
