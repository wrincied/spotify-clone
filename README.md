# Spotify Clone: Architectural Showcase



## 1. Executive Summary

This project is an **Architectural Showcase** designed to demonstrate high-level engineering maturity using the latest web standards. This implementation focuses on **Angular 21 Zoneless** reactivity and a **Feature-Based Architecture**. 



By leveraging **Angular Signals**, the application achieves near-zero CPU overhead during state transitions, providing a fluid user experience comparable to native desktop applications. The backend is a streamlined **Node.js (ESM)** environment designed for high portability and rapid architectural review.



## 2. Detailed Directory Anatomy

The project follows a **Domain-Driven Design (DDD)** inspired structure, ensuring strict separation of concerns and preventing the "Big Ball of Mud" anti-pattern.


## Backend: 
https://github.com/wrincied/spotify-backend
```text

src/app/

├── core/                 # Application-wide singletons

│   ├── guards/           # Route protection (e.g., adminGuard)

│   ├── services/         # Global state/logic (AuthService, AudioService)

│   └── models/           # Global interfaces and types

├── shared/               # Stateless UI-kit & Utilities

│   ├── components/       # Pure UI components (Buttons, Cards)

│   ├── pipes/            # Pure data transformers

│   └── directives/       # Reusable DOM behaviors

├── layout/               # App Shell 

│   ├── sidebar/          # Navigation shell

│   ├── player-bar/       # Global media controls

│   └── header/           # Contextual actions

└── features/             # Domain-isolated modules

    ├── auth/             # Login, Signup, User Profile

    ├── search/           # Search logic and results

    ├── library/          # User-specific collections

    ├── artist-page/      # Artist-specific domain logic

    └── admin/            # Protected management dashboard

```



**Architectural Reasoning:**

- **Core:** Prevents service duplication and ensures global state (like the audio player) remains a single source of truth.

- **Shared:** Decoupled from business logic, making the UI kit highly reusable and testable.

- **Features:** Ensures that changes in the "Search" domain do not inadvertently break the "Auth" domain.



## 3. Deep-Dive: Smart Metadata Synchronization

A key engineering highlight of this project is the **Self-Healing Database** pattern for media metadata.



### The Problem

Media files (MP3/WAV) often lack consistent duration metadata in the database, and server-side processing (FFmpeg) is resource-intensive for lightweight environments.



### The Solution: Client-Side Offloading

1. **Event Trigger:** When a track is first loaded in the browser, the `loadedmetadata` event is captured.

2. **Calculation:** The frontend calculates the precise duration using the browser's native audio engine.

3. **Synchronization:** If the database record is missing metadata, the frontend initiates a `PATCH` request.

4. **Persistence:** The Node.js backend updates the JSON-based DB, "healing" the record for all future users.



**Benefit:** This strategy offloads heavy media processing from the server to the client, significantly reducing backend CPU cycles and memory footprint.



## 4. Technical Audit & Design Decisions



### Signals vs Zone.js (Zoneless)

The application is built to be **Zoneless-ready**. By using Angular Signals, we eliminate the need for `zone.js` to intercept every asynchronous event. This results in:

- **Fine-grained Reactivity:** Only the specific DOM nodes bound to a Signal are updated.

- **Performance:** Critical for high-frequency updates, such as the audio seek bar and volume sliders.



### BEM & SCSS Strategy

Styles are authored using the **Block Element Modifier (BEM)** methodology.

- **Encapsulation:** Each component has its own SCSS file, preventing global style leakage.

- **Specificity:** Low specificity selectors ensure the UI is easy to override and maintain.



### Security Implementation

- **Route Protection:** Functional guards (`adminGuard`) prevent unauthorized access to the administrative layer.

- **Data Integrity:** All API inputs are treated as untrusted and validated on the server side.

- **Session Security:** (Planned) Implementation of HttpOnly cookies to mitigate XSS-based token theft.



### Intentional Constraints: JSON-based DB

The use of a JSON-based database is a **conscious architectural choice** for this showcase. It provides **Zero-Config Portability**, allowing reviewers to run the project immediately without setting up PostgreSQL or MongoDB. The system is designed with a Repository Pattern, making the switch to a production-grade SQL database a trivial configuration change.



## 5. API Contract Documentation



The backend follows RESTful principles with minimal, secure responses.



| Method | Endpoint | Description | Auth Required |


| `GET` | `/api/songs` | Retrieve all tracks | No |

| `GET` | `/api/songs/:id` | Retrieve specific track details | No |

| `PATCH` | `/api/songs/:id` | Update track metadata (Duration/Plays) | Yes |

| `POST` | `/api/auth/login` | Authenticate user | No |



### Metadata Update Example

**Request:** `PATCH /api/songs/123`

```json

{

  "duration": 245.5

}

```

**Response:** `200 OK`

```json

{

  "status": "success",

  "updatedFields": ["duration"]

}

```



## 6. Development Lifecycle



### Prerequisites

- Node.js (Latest LTS)

- NPM 10+



### Installation

```bash

# Install dependencies for both environments

npm install

```



### Execution

**Frontend (Angular 21):**

```bash

ng serve

```

**Backend (Node.js ESM):**

```bash
cd spotify-backend
node server.js

```
## Legal Disclaimer

This project is a non-commercial, educational prototype developed for portfolio and architectural demonstration purposes only. 

- **Copyrighted Content:** The audio tracks, artist names, and album artwork used in this application belong to their respective copyright owners. 
- **Usage Policy:** This software does not intend to infringe on any copyright laws. The music files are included strictly for demonstration of the audio engine functionality and metadata synchronization logic.
- **No Distribution:** I do not claim ownership of the media content and do not encourage the distribution or piracy of copyrighted material. 

If you are a copyright holder and wish for your content to be removed, please contact me directly.
