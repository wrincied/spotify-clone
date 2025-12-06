export interface SongInterface {
  thumbnail: string | null;
  id: string;
  title: string;
  duration: number;
  artist: string;
  url: string;
}

export interface AlbumInterface {
  thumbnail: any;
  id: string;
  title: string;
  description: string;
  cover: string | null;
  songs: SongInterface[]; // Строгая типизация вместо any[]
}
export interface CategoryInterface {
  name: string;
  id: string;
  color: string;
  albums?: string[]; // ids of albums
  songs?: string[]; // ids of songs
  playlists?: string[]; // future
}
