# Spotify Clone

This project is a web application inspired by the Spotify web player, allowing users to browse, search, and play music. It features a full frontend built with Angular and a dedicated backend powered by Node.js and Express.

![Spotify Clone Screenshot](https://via.placeholder.com/800x450.png?text=Spotify+Clone+UI)

## ✨ Key Features

*   **Music Playback**: Core functionality to play, pause, skip, and control volume.
*   **User Authentication**: Secure sign-up and login system.
*   **Browse Music**: Discover new music through categories, artists, and albums.
*   **Search**: Find your favorite songs, artists, and albums.
*   **Playlists**: Create and manage your own playlists.
*   **Artist & Album Pages**: View detailed pages for artists and albums.
*   **Admin Panel**: A special section for administrative tasks.
*   **Responsive Design**: A user-friendly experience across different devices.

## 🛠️ Tech Stack

*   **Frontend**:
    *   [Angular](https://angular.io/)
    *   [RxJS](https://rxjs.dev/) for reactive programming
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [SCSS](https://sass-lang.com/) for styling
*   **Backend**:
    *   [Node.js](https://nodejs.org/)
    *   [Express.js](https://expressjs.com/)
*   **Database**:
    *   Flat JSON files for simplified data storage.

## 📂 Project Structure (Frontend)

The frontend is a well-structured Angular application designed for scalability and maintainability.

```
/src
├── app/
│   ├── components/  # Reusable UI components (buttons, player, cards)
│   ├── pages/       # Main application views (Home, Search, Library)
│   ├── services/    # Core logic (API calls, auth, player state)
│   ├── guards/      # Route guards for access control (e.g., admin)
│   ├── pipes/       # Custom pipes for data formatting (e.g., time)
│   ├── interface/   # TypeScript interfaces for data models
│   └── app.routes.ts # Main application routing
├── assets/          # Static assets (images, fonts, icons)
├── environments/    # Build environment configuration
└── styles.scss      # Global styles
```

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/en/download/) (v20.x or higher recommended)
*   [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd spotify-clone
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    cd spotify-backend
    npm install
    cd ..
    ```

### Running the Application

You need to run two separate commands in two separate terminals to start both the frontend development server and the backend API.

1.  **Start the Backend Server:**
    ```bash
    # In the /spotify-clone/spotify-backend directory
    npm start
    ```
    The backend will be running on `http://localhost:3000`.

2.  **Start the Frontend Angular App:**
    ```bash
    # In the root /spotify-clone directory
    npm start
    ```
    The frontend will be available at `http://localhost:4200`.

---

## ⚙️ Backend Details

The backend is built with Node.js and Express, serving a RESTful API to the frontend.

### Backend Structure

The backend code is organized to separate concerns, making it easy to manage routes, logic, and middleware.

```
/spotify-backend
├── db/                # JSON files acting as a simple database
├── public/            # Publicly served files (e.g., music tracks)
└── src/
    ├── controllers/   # Business logic for handling requests
    ├── middleware/    # Express middleware (auth, error handling)
    └── routes/        # API route definitions
└── server.js          # The main Express server entry point
```

---

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

## Author

- **John Doe** - *Initial work* - [johndoe](https.github.com)