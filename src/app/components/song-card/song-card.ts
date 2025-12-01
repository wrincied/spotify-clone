import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-song-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './song-card.html',
  styleUrls: ['./song-card.scss'],
})
export class SongCard implements OnInit {

  @Input() playlistThumbnail!: string;
  @Input() title!: string;
  @Input() description!: string;

  ngOnInit(): void { }
}
