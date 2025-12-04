import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api';
import { AlbumInterface } from '../../interface/models';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist.html',
  styleUrls: ['./playlist.scss']
})
export class PlaylistComponent implements OnInit {

  album: AlbumInterface | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.api.getPlaylistById(id).subscribe((album: AlbumInterface) => {
      this.album = album;
      console.log('ALBUM PAGE:', this.album);
    });
  }
}

