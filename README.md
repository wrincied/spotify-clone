# SpotifyClone — Portfolio Project

A full-stack recreation of the Spotify interface and music library management system, built with Angular (Standalone Architecture) and a Node.js REST API.  
This project demonstrates real-world frontend engineering, backend integration, UI/UX architecture, component composition, and full CRUD data management through a custom Admin Panel.

---

## Technical Summary

### Tech Stack
- Frontend: Angular (Standalone Components), TypeScript, RxJS, SCSS
- Backend: Node.js, Express
- Database: Local JSON (albums.json, songs.json, categories.json)

---

## Key Features

### Backend and Admin Panel
- Full internal Admin UI for managing Songs, Albums, Categories
- CRUD operations for all entities
- Automatic relation cleanup:
  - Removing an album removes all references to its songs
  - Removing a song removes it from all albums
  - Removing a category detaches it from all related entities
- Smart MP3 upload using music-metadata:
  - Automatic duration extraction
  - Automatic ID generation
- Static serving of audio and UI assets

### Frontend (Angular)
- Unified AlbumCard component supporting multiple modes (standard, fixedSize, Top Result)
- Search page:
  - Live filtering with reactive updates
  - Top Result algorithm
  - Display of top 4 matching tracks
  - Grid layout replicating Spotify’s design
- Playlist page:
  - Sticky dynamic header
  - Scroll-based behavior via IntersectionObserver
  - Automatic average-color background generation
- Central MusicStore for reactive caching and state handling
- Declarative navigation via routerLink

---

## Project Structure
spotify-clone/

│
├── backend/
│   ├── server.js
│   ├── db/
│   │   ├── albums.json
│   │   ├── songs.json
│   │   └── categories.json
│   └── public/
│
├── src/app/
│   ├── components/
│   │   ├── albumCard/
│   │   ├── songRow/
│   │   ├── slider/
│   │   └── ...
│   ├── pages/
│   │   ├── home/
│   │   ├── search/
│   │   ├── playlist/
│   │   └── ...
│   ├── services/
│   │   ├── ApiService/
│   │   └── music-store/
│   └── interface/
│
└── README.md

---

## Git Workflow
main        → stable production-ready code

dev         → integrated development branch

feature/* → isolated feature branches

---

## Development Setup

### Start Backend
node backend/server.js

API: http://localhost:3000/api  
Admin Panel: http://localhost:3000/

### Start Angular
ng serve

Application: http://localhost:4200/

---

## Production Build
ng build


Output in:
dist/spotify-clone/


---

## Testing
ng test

ng e2e

---

## Project Status

Active portfolio project demonstrating:
- Modern Angular architecture
- Full-stack API + UI integration
- Reactive state management
- UI/UX engineering
- Maintainable and scalable component structure
