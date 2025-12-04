import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlbumInterface, SongInterface } from '../../interface/models';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-song',
  imports: [],
  templateUrl: './song.html',
  styleUrl: './song.scss',
})

export class SongComponent {
  collectionId: string = '';
  songId: string = '';

  album: AlbumInterface | null = null;
  song: SongInterface | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) { }

  ngOnInit() {
    // 1. Получение параметров маршрута
    this.collectionId = this.route.snapshot.paramMap.get('collectionId') ?? '';
    this.songId = this.route.snapshot.paramMap.get('songId') ?? '';

    // 2. Загрузить альбом по ID
    this.api.getPlaylistById(this.collectionId).subscribe((album: AlbumInterface) => {
      this.album = album;

      // 3. Найти песню внутри альбома
      this.song = album.songs.find(s => s.id === this.songId) || null;
    });
  }
}
