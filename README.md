# Comics & Manga World

An online reading portal for manga, western comics and graphic novels, built as a lab project for **20CYS202 – User Interface Design** at Amrita Vishwa Vidyapeetham.

---

## Features

- **Catalog** of 39 titles (12 manga, 12 comics, 15 graphic novels / novels) shown as cover cards.
- **Live search** by title, author or genre.
- **Filters and sorting** by type (All / Manga / Comics / Graphic Novels), genre, and sort order (Featured, Highest Rated, Most Popular, Release Year, Title A–Z / Z–A), plus a one-click reset.
- **Hero carousel** that rotates through featured titles every 6 seconds.
- **In-app PDF reader** in a modal, with fullscreen, open-in-new-tab and download buttons.
- **Book details modal** with metadata and reader reviews.
- **Accounts**: register, sign in, sign out, and a one-click **Demo Login** for evaluators.
- **My Library** (favorites) and **History** (last 20 titles read), stored per user.
- **News & Top 5** page with weekly rankings for manga, comics and graphic novels.
- **Dark / light theme** that is remembered between visits.
- **Responsive layout** for desktop, tablet and mobile, with toast notifications and keyboard support (`Esc` closes modals).

## Project structure

```
comics-manga-world/
├── index.html                 # Single-page app shell (header, hero, catalog, modals, footer)
├── README.md
├── CSS/
│   ├── modern.css             # Active stylesheet (design system, layout, themes)
│   ├── H.css                  # Legacy (earlier multi-page version, unused)
│   ├── Login.css              # Legacy (unused)
│   ├── CreateAccount.css      # Legacy (unused)
│   └── proj2.css              # Legacy (unused)
├── JavaScript/
│   ├── data.js                # CATALOG_DATA (titles) and NEWS_DATA (Top 5 articles)
│   ├── api.js                 # MockBackendService: auth, favorites, history, reviews, queries
│   ├── app.js                 # ComicApp: routing, rendering, filters, reader, modals, theme
│   ├── login.js               # Legacy adapter (unused)
│   └── signup.js              # Legacy adapter (unused)
├── Images/                    # Covers, Top 5 banners, logos and icons
│   ├── 1piece.jpg
│   ├── Avengers.jpg
│   ├── mangaTop5.png
│   ├── Comic Manga.ico
│   └── ...                    # ~55 image files in total
└── pdf/                       # Reader PDFs (~1 GB, not included in this archive)
```

## Running the project

No build step and no server are needed.

1. Put the `pdf/` folder next to `index.html` (see below).
2. Double-click `index.html` to open it in a modern browser (Chrome, Edge, Firefox or Safari).

### The `pdf/` folder

The reading PDFs are about 1 GB in total, so they are **not part of this archive**. Each title in `JavaScript/data.js` has a `pdf` field such as `pdf/Avengers.pdf`. Place the files in a `pdf/` folder next to `index.html` with matching names, or edit those paths. Without them everything works except the reader, which opens an empty frame.

## Demo accounts

| Role | Username / email | Password |
|---|---|---|
| Demo reader | `demo@comicworld.org` | `demo123` |
| Admin | `vishal@amrita.edu` | `vishal123` |

You can also create your own account from the **Create Account** tab. Reading, favoriting and reviewing all require signing in.

## How it works

- **Routing** uses the URL hash. Catalog is the home view and keeps a clean `index.html` URL. The other views use `#news`, `#favorites` and `#history`. `#book-<id>` and `#read-<id>` open a book's details or reader directly.
- **Data** lives in `data.js`. To add a title, append an object to `CATALOG_DATA` with a cover in `Images/` and a PDF in `pdf/`.
- **Storage** uses `localStorage` keys:
  - `comics_db_users_v2` for accounts
  - `comics_db_session_v2` for the signed-in session
  - `comics_db_reviews_v2` for reviews
  - `comics_db_favs_<userId>` for each user's favorites
  - `comics_db_hist_<userId>` for each user's history
  - `comics_theme` for the chosen theme
- **Passwords** are hashed with SHA-256 and a fixed salt using the Web Crypto API.

## Performance notes

- Switching theme temporarily disables CSS transitions (a `theme-switching` class on `<html>`) so the whole page repaints once instead of animating hundreds of elements.
- Heavy `backdrop-filter` blur was removed from the card badges, reduced on the header, and applied to modals only while they are open.
"# Comic-Manga-Store" 
