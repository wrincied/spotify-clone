# Spotify Clone: High-Fidelity Architectural Showcase

> This project is a production-grade prototype engineered to demonstrate mastery of modern, reactive web architecture. It explores **Zoneless-ready reactivity** using Angular Signals and implements a unique **self-healing data pattern**, positioning it beyond a simple clone and into a sophisticated architectural showcase.

![Spotify Clone Screenshot](https://via.placeholder.com/1200x600.png?text=Dark+Mode+/+Reactive+UI)
*(A placeholder image of the application's reactive, dark-mode UI.)*

## 🛠️ Technology Stack & Infrastructure

This project utilizes a modern, decoupled full-stack architecture.

| Layer | Technology | Key Features |
| :--- | :--- | :--- |
| **Frontend** | **Angular 21** | Standalone Components, Zoneless-ready reactivity |
| | **Angular Signals** | Fine-grained, glitch-free state management |
| | **SCSS + BEM** | Scalable, modular, and maintainable styling |
| **Backend** | **Node.js (ESM)** | Modern, modular, and tree-shakable codebase |
| | **Express.js** | Minimalist framework for robust API development |
| | **JSON Database** | Portable, zero-dependency filesystem persistence |
| **Infrastructure**| **Firebase Hosting** | Global CDN for low-latency frontend delivery |
| | **Render** | Zero-downtime backend deployment with CI/CD |
| | **Custom CORS**| Secure middleware for handling cross-origin requests |

## 🏗️ Architectural Deep Dive

A professional architecture is defined by its structure and separation of concerns. This project adheres to industry-standard patterns for maintainability and scalability.

### Frontend: Feature-Based Architecture

The Angular application is organized using a feature-based structure. This pattern collocates files related to a specific domain feature, promoting modularity and making it easier for teams to work on different parts of the application concurrently.

```
src/app/
├── core/               # Singleton services, guards, and core logic (e.g., AuthService)
│   ├── guards/
│   └── services/
├── features/           # Individual application features (e.g., Home, Search)
│   ├── home/
│   ├── search/
│   └── playlist/
├── layout/             # Main application shell and layout components
│   ├── spotify-sidebar/
│   └── top-nav/
└── shared/             # Reusable components, pipes, and directives
    ├── components/
    ├── directives/
    └── pipes/
```

### Backend: Controller-Service-Data Architecture

The Node.js backend follows a classic layered architecture, ensuring a clear separation between request handling, business logic, and data access.

```
spotify-backend/
├── data/               # Filesystem-based JSON files acting as the data layer
│   └── songs.json
└── src/
    ├── controllers/    # Handles HTTP requests and responses
    ├── middleware/     # Express middleware for auth, logging, etc.
    ├── routes/         # Defines API endpoints and maps them to controllers
    └── services/       # Contains business logic (e.g., database interactions)
```

## 🧠 Smart Metadata Sync (Self-Healing Data)

A key feature of this project is its intelligent, automated data enrichment pattern. Raw audio files often have missing metadata, such as song duration. Instead of relying on brittle server-side libraries, this project offloads this calculation to the client.

**The process is as follows:**

1.  **Detection**: The Angular frontend identifies that a song object is missing its `duration` property.
2.  **Client-Side Calculation**: It loads the audio using the native **HTML5 Audio API**. The browser itself efficiently parses the metadata and fires the `loadedmetadata` event.
3.  **Background Sync**: A listener in Angular's `PlayerService` captures this event, extracts the precise duration, and dispatches a lightweight, asynchronous `PATCH` request to the backend.
4.  **Atomic Write**: The Express server receives the request and performs an atomic write to the `songs.json` file, permanently "healing" the data record for all future requests.

This demonstrates a robust, event-driven pattern for maintaining data integrity in a distributed system.

## 🌐 API Documentation

The backend exposes a RESTful API. The `songs` resource is detailed below.

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/songs` | Retrieves a list of all songs. | Public |
| `POST` | `/api/songs` | Adds a new song. | Admin Only |
| `PATCH` | `/api/songs/:id` | Updates song metadata (e.g., duration). | **Public (For Demo)** |
| `PUT` | `/api/songs/:id` | Fully replaces a song's data. | Admin Only |
| `DELETE` | `/api/songs/:id` | Removes a song. | Admin Only |
| `POST` | `/api/songs/assign-album`| Associates a song with an album. | Demo Mode |

---

## 🛡️ Senior-Level Architectural Audit

*(A candid, senior-level review of the project's architecture and trade-offs.)*

This project successfully demonstrates a forward-thinking approach to modern web development.

**Strengths:**
The choice to build the frontend with **Angular 21's Standalone API** and **Signals** is a significant strength. It proves a deep understanding of the framework's future direction toward a zoneless, more performant, and simpler developer experience. The unidirectional data flow implemented in the `PlayerService` is clean and efficient. On the backend, the strict use of **ES Modules** and a clean Controller-Service separation shows discipline and adherence to modern Node.js best practices.

**Strategic Trade-offs:**
Every project involves trade-offs. The architectural decisions here were made deliberately to optimize for a **zero-dependency, portable prototype**.

1.  **JSON Database:** A filesystem-based JSON database was chosen for its simplicity and portability. It requires no external services, making the project easy to clone and run. **In a production environment, this would be replaced with a robust relational database like PostgreSQL** to ensure data integrity, handle concurrent writes, and scale effectively.

2.  **Open `PATCH` Endpoint:** The `PATCH /api/songs/:id` endpoint is intentionally left open to allow the "Smart Metadata Sync" feature to function in this demo. This is a calculated decision for showcasing the self-healing data pattern. **In a production system, this endpoint would be secured using JWT-based authentication and authorization**, likely restricted to admin roles or a trusted internal service, to prevent unauthorized modifications.

These trade-offs demonstrate a strong "Product Mindset"—the ability to choose the right tools and security postures for the specific stage and goals of a project.
