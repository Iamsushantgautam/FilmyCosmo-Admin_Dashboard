## FilmyCosmo – Project Overview

This project is a full‑stack movie app with a React frontend and an Express/MongoDB backend.  
Below is a quick guide to what each important file or folder does.

### Root
- **`backend/`**: Node/Express API server and database models.
- **`frontend/`**: React single‑page application (Vite-based).

---

## Backend (API server)

Located in the `backend` folder.

- **`server.js`**  
  Entry point for the backend. Sets up Express, connects to MongoDB, enables CORS and JSON parsing, and mounts the main routes:
  - `/api/auth` – authentication routes
  - `/api/movies` – movie CRUD and listing
  - `/api/home-config` – home page layout configuration (for admin)

- **`config/db.js`**  
  Connects to MongoDB using `MONGO_URI` from `.env`.

- **`config/cloudinary.js`**  
  Configures Cloudinary for image upload (posters and screenshots).

- **`models/User.js`**  
  Mongoose schema/model for users (login/register and roles such as admin).

- **`models/Movie.js`**  
  Mongoose schema/model for movies.  
  Stores title, description, year, `tags` (genres), `posterUrl`, and `screenshots`.

- **`models/HomeConfig.js`**  
  Mongoose model for storing home page layout settings (hero title, subtitle, and which sections are on/off).

- **`middleware/auth.js`**  
  Express middleware that reads a JWT from `x-auth-token` or `Authorization` header, verifies it, and attaches the decoded `user` to `req`.

- **`middleware/admin.js`**  
  Express middleware that ensures the authenticated user has the `admin` role; used to protect admin-only routes.

- **`routes/auth.js`**  
  Handles user registration and login, returning JWT tokens.

- **`routes/movies.js`**  
  REST endpoints for movies:
  - `GET /api/movies` – list all movies (optionally used with pagination on the frontend).
  - `GET /api/movies/:id` – get a single movie by ID (for the detail page).
  - `POST /api/movies` – create movie (admin + auth; supports file upload to Cloudinary).
  - `PUT /api/movies/:id` – update movie (admin only).
  - `DELETE /api/movies/:id` – delete movie (admin only).

- **`routes/homeConfig.js`**  
  Endpoints for home page layout configuration:
  - `GET /api/home-config` – fetch current layout config (public).
  - `PUT /api/home-config` – update hero text and show/hide toggles (admin only).

---

## Frontend (React app)

Located in the `frontend` folder.

- **`index.html`**  
  Base HTML template that includes a `<div id="root">` where the React app mounts.

- **`src/main.jsx`**  
  Frontend entry point. Sets up React Router and defines routes:
  - `/` – wraps all pages with the shared `App` layout.
  - `index` – `Home` page.
  - `/moviegrip` – full movie grid page.
  - `/movie/:id` – movie detail page.
  - `/admin` – admin dashboard.

- **`src/App.jsx`**  
  Shared layout component used for all pages:
  - Top navigation bar with links: Home, Movies, Admin (and active state styling).
  - `<Outlet />` for child routes.
  - Common footer at the bottom.

- **`src/index.css`**  
  Global styles for the whole frontend:
  - Base typography, buttons, forms.
  - Layout styles for navbar, hero, sections, cards.
  - Home page components (search bar, chips, carousels).
  - Movie detail layout and admin dashboard styles.

### Frontend pages (`src/pages/`)

- **`Home.jsx`**  
  Public home page:
  - Fetches movies and home layout config.
  - Shows a hero section (title and subtitle from `HomeConfig`).
  - Top search bar + genre chips + filters/sort.
  - Trending carousel (horizontal scroll).
  - Search results grid.
  - “Browse by Genre” carousels.

- **`moviegrip.jsx`**  
  Paginated movie grid page:
  - Fetches movies with `?page` and `?limit` query parameters.
  - Displays a simple responsive grid with pagination controls.

- **`MovieDetail.jsx`**  
  Detailed page for a single movie:
  - Fetches movie by ID from `/api/movies/:id`.
  - Shows poster, title, year, genres, description, screenshots and download buttons (placeholder behavior).

- **`Admin.jsx`**  
  Admin dashboard:
  - If not logged in: shows Login and Register panels.
  - If logged in (admin):
    - Sidebar navigation for **Overview**, **Home Layout**, and **Movies**.
    - **Overview**: quick stats (movie count, which home sections are on/off) and an upload panel.
    - **Home Layout**: edit hero title/subtitle and toggle visibility of Trending, Search, and Genre sections (on/off switches).
    - **Movies**: list of all movies with poster thumbnail, title, year and a Delete button.

### Frontend components (`src/components/`)

- **`MovieCard.jsx`**  
  Reusable card for a movie:
  - Shows poster, rating pill (if provided), title, and primary genre.
  - Click navigates to the movie detail page.
  - Has a `compact` mode for horizontal carousels.

- **`LoginForm.jsx`**  
  Form used on the Admin page to log in an existing user, obtaining a JWT token.

- **`RegisterForm.jsx`**  
  Form used on the Admin page to register a new user and receive a token.

- **`UploadForm.jsx`**  
  Form for admins to create a new movie:
  - Accepts title, description, year, tags, poster, and screenshots.
  - Sends data to `POST /api/movies`.

---

## How the pieces fit together

1. The **frontend** calls the **backend API** (`VITE_API_URL` or `http://localhost:5000/api`) to load movies, home layout config, and to perform admin actions.
2. Users see the **Home** page, browse/trend/search/filter movies, and click a card to get to the **Movie Detail** page.
3. Admins go to `/admin`, login or register, and then:
   - Upload and delete movies.
   - Change the home layout (hero text and on/off switches for sections).
4. Layout changes are stored in `HomeConfig` in MongoDB and drive what the Home page shows.


