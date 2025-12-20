import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlbumInterface, SongInterface } from '../../interface/models';
import { MusicStoreService } from '../../services/music-store/music-store'; // Предполагаем наличие стора

@Component({
  selector: 'app-song',
  standalone: true,
  templateUrl: './song.html',
  styleUrl: './song.scss',
})
export class SongComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private musicStore = inject(MusicStoreService);

  album: AlbumInterface | null = null;
  song: SongInterface | null = null;

  ngOnInit() {
    const collectionId = this.route.snapshot.paramMap.get('collectionId');
    const songId = this.route.snapshot.paramMap.get('songId');

    if (collectionId && songId) {
      // 1. Получаем все песни из стора (чтобы иметь полные данные: url, title)
      const allSongs = this.musicStore.currentSongs();
      const allAlbums = this.musicStore.currentAlbums();

      // 2. Находим нужный альбом
      this.album = allAlbums.find(a => a.id === collectionId) || null;

      // 3. Находим песню по ID [cite: 2025-12-14]
      // Исправляем синтаксическую ошибку: s.id
      this.song = allSongs.find(s => String(s.id) === String(songId)) || null;
    }
  }
}