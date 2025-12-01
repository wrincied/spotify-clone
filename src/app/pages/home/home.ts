import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlbumService } from '../../services/album';
import { SongCard } from '../../components/song-card/song-card';
import { TopNav } from '../../components/top-nav/top-nav';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SongCard, TopNav],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {

  public SongCards: any[] = [];

  constructor(private albumService: AlbumService) { }

  ngOnInit(): void {
    this.albumService.getAlbums().subscribe({
      next: (albums) => {
        this.SongCards = albums;
        console.log("Loaded albums:", albums);
      },
      error: (err) => console.error("AlbumService error:", err)
    });
  }
  scrollHorizontally(event: WheelEvent) {
    const container = event.currentTarget as HTMLElement;
    container.scrollLeft += event.deltaY;
  }

}
