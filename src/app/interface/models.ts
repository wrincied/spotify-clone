export interface SongInterface {
thumbnail: any;
  id: string;
  title: string;
  duration: number;
  artist: string;
  url: string;
}

export interface AlbumInterface {
  id: string;
  title: string;
  description: string;
  cover: string;
  songs: SongInterface[]; // Строгая типизация вместо any[]
}