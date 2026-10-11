/**
 * Online Comics & Graphic Novels - Frontend Application Controller
 * Handles SPA navigation, dynamic rendering, filters, search, reader modal,
 * bookmarks, user session, and theme management.
 * 
 * Author: Vishal S (CB.EN.U4CYS22075)
 */

document.addEventListener("DOMContentLoaded", () => {
  const app = new ComicApp();
  window.comicApp = app;
});

class ComicApp {
  constructor() {
    this.api = window.apiService;
    this.state = {
      view: "catalog", // 'catalog', 'news', 'favorites', 'history'
      filters: {
        type: "all",
        genre: "all",
        search: "",
        sortBy: "featured",
        language: "all"
      },
      user: this.api.getCurrentSession(),
      theme: localStorage.getItem("comics_theme") || "dark",
      activeBook: null,
      heroIndex: 0
    };

    this.featuredBooks = CATALOG_DATA.filter(b => b.featured);
    this.heroInterval = null;

    this.initDOM();
    this.initTheme();
    this.initAuthUI();
    this.bindEvents();
    this.handleRouting();
    this.startHeroCarousel();
    this.render();
  }

  initDOM() {
    // Cache common DOM elements
    this.elements = {
      themeToggleBtn: document.getElementById("themeToggleBtn"),
      navLinks: document.querySelectorAll(".nav-link"),
      userProfileArea: document.getElementById("userProfileArea"),
      authModalBtn: document.getElementById("authModalBtn"),
      mobileToggleBtn: document.getElementById("mobileToggleBtn"),
      mobileNav: document.getElementById("mobileNav"),
      
      // Hero
      heroTitle: document.getElementById("heroTitle"),
      heroDesc: document.getElementById("heroDesc"),
      heroCover: document.getElementById("heroCover"),
      heroReadBtn: document.getElementById("heroReadBtn"),
      heroDetailsBtn: document.getElementById("heroDetailsBtn"),
      
      // Catalog Views
      catalogSection: document.getElementById("catalogSection"),
      catalogGrid: document.getElementById("catalogGrid"),
      resultsCount: document.getElementById("resultsCount"),
      searchInput: document.getElementById("searchInput"),
      searchClearBtn: document.getElementById("searchClearBtn"),
      typePills: document.querySelectorAll(".type-pill"),
      genreSelect: document.getElementById("genreSelect"),
      sortSelect: document.getElementById("sortSelect"),
      resetFiltersBtn: document.getElementById("resetFiltersBtn"),

      // Other Sections
      newsSection: document.getElementById("newsSection"),
      newsContainer: document.getElementById("newsContainer"),

      // Modals
      readerModal: document.getElementById("readerModal"),
      readerFrame: document.getElementById("readerFrame"),
      readerTitle: document.getElementById("readerTitle"),
      readerDownloadBtn: document.getElementById("readerDownloadBtn"),
      readerNewTabBtn: document.getElementById("readerNewTabBtn"),
      readerFullscreenBtn: document.getElementById("readerFullscreenBtn"),

      detailModal: document.getElementById("detailModal"),
      detailBody: document.getElementById("detailBody"),

      authModal: document.getElementById("authModal"),
      authTabLogin: document.getElementById("authTabLogin"),
      authTabSignup: document.getElementById("authTabSignup"),
      loginForm: document.getElementById("loginForm"),
      signupForm: document.getElementById("signupForm"),
      demoLoginBtn: document.getElementById("demoLoginBtn"),

      toastContainer: document.getElementById("toastContainer")
    };
  }

  initTheme() {
    document.documentElement.setAttribute("data-theme", this.state.theme);
    this.updateThemeIcon();
  }

  toggleTheme() {
    this.state.theme = this.state.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("comics_theme", this.state.theme); } catch (e) {}

    // Suppress all transitions while the theme flips so the browser repaints
    // everything once instead of animating hundreds of elements (removes lag).
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", this.state.theme);
    this.updateThemeIcon();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("theme-switching"));
    });
    this.showToast(`Switched to ${this.state.theme} mode`, "info");
  }

  updateThemeIcon() {
    if (this.elements.themeToggleBtn) {
      this.elements.themeToggleBtn.innerHTML = this.state.theme === "dark" 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      this.elements.themeToggleBtn.title = `Switch to ${this.state.theme === "dark" ? "Light" : "Dark"} Mode`;
    }
  }

  initAuthUI() {
    if (!this.elements.userProfileArea) return;

    if (this.state.user) {
      this.elements.userProfileArea.innerHTML = `
        <div class="user-profile-menu">
          <img src="${this.state.user.avatar || 'Images/profile.png'}" alt="Avatar" class="user-avatar">
          <span class="user-name">${this.escapeHTML(this.state.user.username)}</span>
          <button class="btn btn-outline" id="logoutBtn" style="padding: 6px 12px; font-size: 0.8rem;">Log Out</button>
        </div>
      `;
      document.getElementById("logoutBtn").addEventListener("click", () => this.handleLogout());
    } else {
      this.elements.userProfileArea.innerHTML = `
        <button class="btn btn-primary" id="openAuthModalBtn" style="padding: 8px 16px; font-size: 0.88rem;">
          Sign In
        </button>
      `;
      document.getElementById("openAuthModalBtn").addEventListener("click", () => this.openAuthModal("login"));
    }
  }

  bindEvents() {
    // Theme toggle
    if (this.elements.themeToggleBtn) {
      this.elements.themeToggleBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Mobile nav toggle
    if (this.elements.mobileToggleBtn) {
      this.elements.mobileToggleBtn.addEventListener("click", () => {
        this.elements.mobileNav.classList.toggle("open");
      });
    }

    // Brand logo -> home (clean URL)
    const brand = document.querySelector(".brand-link");
    if (brand) {
      brand.addEventListener("click", e => {
        e.preventDefault();
        this.navigateTo("catalog");
      });
    }

    // Nav Links (Routing)
    this.elements.navLinks.forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const view = link.getAttribute("data-view");
        this.navigateTo(view);
        if (this.elements.mobileNav) this.elements.mobileNav.classList.remove("open");
      });
    });

    // Search input
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener("input", e => {
        this.state.filters.search = e.target.value;
        if (this.elements.searchClearBtn) {
          this.elements.searchClearBtn.style.display = e.target.value ? "block" : "none";
        }
        this.renderCatalog();
      });
    }

    // Clear Search button
    if (this.elements.searchClearBtn) {
      this.elements.searchClearBtn.addEventListener("click", () => {
        this.elements.searchInput.value = "";
        this.state.filters.search = "";
        this.elements.searchClearBtn.style.display = "none";
        this.renderCatalog();
      });
    }

    // Type pills
    this.elements.typePills.forEach(pill => {
      pill.addEventListener("click", () => {
        this.elements.typePills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.state.filters.type = pill.getAttribute("data-type");
        this.renderCatalog();
      });
    });

    // Genre selector
    if (this.elements.genreSelect) {
      this.elements.genreSelect.addEventListener("change", e => {
        this.state.filters.genre = e.target.value;
        this.renderCatalog();
      });
    }

    // Sort selector
    if (this.elements.sortSelect) {
      this.elements.sortSelect.addEventListener("change", e => {
        this.state.filters.sortBy = e.target.value;
        this.renderCatalog();
      });
    }

    // Reset Filters button
    if (this.elements.resetFiltersBtn) {
      this.elements.resetFiltersBtn.addEventListener("click", () => {
        this.resetFilters();
      });
    }

    // Modal Close buttons
    document.querySelectorAll(".modal-close-btn").forEach(btn => {
      btn.addEventListener("click", () => this.closeAllModals());
    });

    // Close modal on backdrop click
    document.querySelectorAll(".modal-overlay").forEach(modal => {
      modal.addEventListener("click", e => {
        if (e.target === modal) this.closeAllModals();
      });
    });

    // Keydown (Esc to close modals)
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") this.closeAllModals();
    });

    // Reader action buttons
    if (this.elements.readerFullscreenBtn) {
      this.elements.readerFullscreenBtn.addEventListener("click", () => this.toggleFullscreenReader());
    }

    // Auth Modal Tabs
    if (this.elements.authTabLogin && this.elements.authTabSignup) {
      this.elements.authTabLogin.addEventListener("click", () => this.switchAuthTab("login"));
      this.elements.authTabSignup.addEventListener("click", () => this.switchAuthTab("signup"));
    }

    // Auth Forms submit
    if (this.elements.loginForm) {
      this.elements.loginForm.addEventListener("submit", e => this.handleLogin(e));
    }
    if (this.elements.signupForm) {
      this.elements.signupForm.addEventListener("submit", e => this.handleSignup(e));
    }

    // Demo Login button
    if (this.elements.demoLoginBtn) {
      this.elements.demoLoginBtn.addEventListener("click", () => this.handleDemoLogin());
    }

    // Hash change event
    window.addEventListener("hashchange", () => this.handleRouting());
  }

  // --- ROUTING ---
  handleRouting() {
    const hash = window.location.hash.replace("#", "") || "catalog";
    if (["catalog", "news", "favorites", "history"].includes(hash)) {
      this.navigateTo(hash, false);
    } else if (hash.startsWith("read-")) {
      const bookId = hash.replace("read-", "");
      const book = this.api.getBookById(bookId);
      if (book) this.openReader(book);
    } else if (hash.startsWith("book-")) {
      const bookId = hash.replace("book-", "");
      const book = this.api.getBookById(bookId);
      if (book) this.openDetails(book);
    }
  }

  navigateTo(view, updateHash = true) {
    this.state.view = view;
    if (updateHash) {
      if (view === "catalog") {
        // Home view: keep the URL clean (index.html) instead of index.html#catalog
        if (window.location.hash) {
          history.pushState(null, "", window.location.pathname + window.location.search);
        }
      } else {
        window.location.hash = view;
      }
    }

    // Update nav links active state
    this.elements.navLinks.forEach(link => {
      if (link.getAttribute("data-view") === view) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // View visibility
    if (view === "news") {
      this.elements.catalogSection.style.display = "none";
      this.elements.newsSection.style.display = "block";
      this.renderNews();
    } else {
      this.elements.catalogSection.style.display = "block";
      this.elements.newsSection.style.display = "none";
      this.renderCatalog();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- HERO CAROUSEL ---
  startHeroCarousel() {
    if (!this.featuredBooks.length) return;
    this.updateHeroContent();
    this.heroInterval = setInterval(() => {
      this.state.heroIndex = (this.state.heroIndex + 1) % this.featuredBooks.length;
      this.updateHeroContent();
    }, 6000);
  }

  updateHeroContent() {
    const book = this.featuredBooks[this.state.heroIndex];
    if (!book || !this.elements.heroTitle) return;

    this.elements.heroTitle.innerHTML = `<span class="gradient-text">${this.escapeHTML(book.title)}</span>`;
    this.elements.heroDesc.textContent = book.description;
    this.elements.heroCover.src = book.image;
    this.elements.heroCover.alt = book.title;

    this.elements.heroReadBtn.onclick = () => this.openReader(book);
    this.elements.heroDetailsBtn.onclick = () => this.openDetails(book);
  }

  // --- CATALOG RENDERING ---
  async renderCatalog() {
    if (!this.elements.catalogGrid) return;

    let items = [];
    if (this.state.view === "favorites") {
      const favIds = this.api.getFavorites(this.state.user ? this.state.user.userId : null);
      items = CATALOG_DATA.filter(b => favIds.includes(b.id));
    } else if (this.state.view === "history") {
      const history = this.api.getReadingHistory(this.state.user ? this.state.user.userId : null);
      const histIds = history.map(h => h.bookId);
      items = histIds.map(id => this.api.getBookById(id)).filter(Boolean);
    } else {
      items = await this.api.getCatalog(this.state.filters);
    }

    this.elements.resultsCount.textContent = `Showing ${items.length} titles`;

    if (items.length === 0) {
      let emptyMsg = "No titles found matching your search and filter criteria.";
      if (this.state.view === "favorites") {
        emptyMsg = "Your favorites list is currently empty. Click the heart on any card to save titles for later!";
      } else if (this.state.view === "history") {
        emptyMsg = "No reading history yet. Open and read any comic to track your reading journey here!";
      }

      this.elements.catalogGrid.innerHTML = `
        <div class="empty-state">
          <h3>No Titles Found</h3>
          <p>${emptyMsg}</p>
          <button class="btn btn-primary" onclick="comicApp.resetFilters()">Explore All Titles</button>
        </div>
      `;
      return;
    }

    const userId = this.state.user ? this.state.user.userId : null;
    const favIds = this.api.getFavorites(userId);

    this.elements.catalogGrid.innerHTML = items.map(book => {
      const isFav = favIds.includes(book.id);
      return `
        <div class="comic-card" data-id="${book.id}">
          <div class="card-cover">
            <img src="${book.image}" alt="${this.escapeHTML(book.title)}" loading="lazy">
            <span class="card-badge ${book.type}">${book.typeLabel}</span>
            <span class="card-rating"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-1px; margin-right:2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>${book.rating.toFixed(1)}</span>
            <button class="card-fav-btn ${isFav ? 'active' : ''}" 
                    title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" 
                    onclick="event.stopPropagation(); comicApp.toggleFavorite('${book.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
          </div>
          <div class="card-body">
            <h4 class="card-title" title="${this.escapeHTML(book.title)}">${this.escapeHTML(book.title)}</h4>
            <p class="card-author">By ${this.escapeHTML(book.author)}</p>
            <div class="card-tags">
              ${book.genres.map(g => `<span class="genre-tag">${g}</span>`).join("")}
            </div>
            <div class="card-footer">
              <button class="btn-read-card" onclick="event.stopPropagation(); comicApp.openReaderById('${book.id}')">
                Read
              </button>
              <button class="btn-preview-card" onclick="event.stopPropagation(); comicApp.openDetailsById('${book.id}')">
                Details
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Make card background clickable for preview
    this.elements.catalogGrid.querySelectorAll(".comic-card").forEach(card => {
      card.addEventListener("click", () => {
        const bookId = card.getAttribute("data-id");
        this.openDetailsById(bookId);
      });
    });
  }

  resetFilters() {
    this.state.filters = {
      type: "all",
      genre: "all",
      search: "",
      sortBy: "featured",
      language: "all"
    };

    if (this.elements.searchInput) this.elements.searchInput.value = "";
    if (this.elements.searchClearBtn) this.elements.searchClearBtn.style.display = "none";
    if (this.elements.genreSelect) this.elements.genreSelect.value = "all";
    if (this.elements.sortSelect) this.elements.sortSelect.value = "featured";
    this.elements.typePills.forEach(p => {
      p.classList.toggle("active", p.getAttribute("data-type") === "all");
    });

    this.navigateTo("catalog");
    this.showToast("All filters have been reset", "info");
  }

  // --- NEWS RENDERING ---
  renderNews() {
    if (!this.elements.newsContainer) return;
    const newsList = this.api.getNews();

    this.elements.newsContainer.innerHTML = newsList.map(item => `
      <article class="news-card">
        <div class="news-image-wrapper">
          <img src="${item.image}" alt="${this.escapeHTML(item.title)}">
        </div>
        <div class="news-content">
          <div class="news-header">
            <span class="news-badge">${item.badge}</span>
            <span class="news-date">${item.date}</span>
          </div>
          <h3 class="news-title">${this.escapeHTML(item.title)}</h3>
          <p class="news-lead">${this.escapeHTML(item.lead)}</p>
          <div class="news-list">
            ${item.topItems.map(top => `
              <div class="news-item">
                <span class="news-rank">${top.rank}</span>
                <div class="news-item-content">
                  <h4>${this.escapeHTML(top.title)}</h4>
                  <p>${this.escapeHTML(top.desc)}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </article>
    `).join("");
  }

  // --- FAVORITES ---
  toggleFavorite(bookId) {
    if (!this.state.user) {
      this.openAuthModal("login");
      this.showToast("Please sign in to save titles to your library", "info");
      return;
    }
    const result = this.api.toggleFavorite(bookId, this.state.user.userId);
    this.showToast(result.isAdded ? "Added to your library" : "Removed from your library", result.isAdded ? "success" : "info");
    this.renderCatalog();
  }

  // --- IN-APP READER MODAL ---
  openReaderById(id) {
    const book = this.api.getBookById(id);
    if (book) this.openReader(book);
  }

  openReader(book) {
    if (!book) return;

    // Check if user is signed in
    if (!this.state.user) {
      this.openAuthModal("login");
      this.showToast(`Please sign in to read "${book.title}"`, "info");
      return;
    }

    // Explicitly hide Book Overview & Auth modals so Reader is front and center
    if (this.elements.detailModal) this.elements.detailModal.classList.remove("active");
    if (this.elements.authModal) this.elements.authModal.classList.remove("active");

    this.state.activeBook = book;
    this.elements.readerTitle.textContent = `${book.title} — ${book.author}`;
    this.elements.readerFrame.src = book.pdf;

    this.elements.readerDownloadBtn.href = book.pdf;
    this.elements.readerDownloadBtn.setAttribute("download", `${book.title}.pdf`);

    this.elements.readerNewTabBtn.href = book.pdf;
    this.elements.readerNewTabBtn.setAttribute("target", "_blank");

    // Record reading progress
    this.api.recordRead(book.id, this.state.user.userId);

    this.elements.readerModal.classList.add("active");
    this.showToast(`Now Reading: ${book.title}`, "success");
  }

  toggleFullscreenReader() {
    const container = this.elements.readerModal.querySelector(".modal-container");
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // --- DETAILS MODAL ---
  openDetailsById(id) {
    const book = this.api.getBookById(id);
    if (book) this.openDetails(book);
  }

  openDetails(book) {
    this.state.activeBook = book;
    const reviews = this.api.getReviews(book.id);
    const userId = this.state.user ? this.state.user.userId : null;
    const isFav = this.api.isFavorite(book.id, userId);

    this.elements.detailBody.innerHTML = `
      <div class="detail-layout">
        <div class="detail-cover">
          <img src="${book.image}" alt="${this.escapeHTML(book.title)}">
        </div>
        <div class="detail-info">
          <h2>${this.escapeHTML(book.title)}</h2>
          <p class="detail-author">By ${this.escapeHTML(book.author)} (${book.year})</p>
          <div class="detail-meta-row">
            <span><strong>Format:</strong> ${book.typeLabel}</span>
            <span><strong>Rating:</strong> <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent-gold); vertical-align:-1px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> ${book.rating.toFixed(1)}</span>
            <span><strong>Releases:</strong> ${book.releases}</span>
            <span><strong>Language:</strong> ${book.language}</span>
          </div>
          <div class="card-tags" style="margin-bottom: 16px;">
            ${book.genres.map(g => `<span class="genre-tag" style="padding: 4px 10px; font-size: 0.8rem;">${g}</span>`).join("")}
          </div>
          <p class="detail-desc">${this.escapeHTML(book.description)}</p>
          <div class="detail-actions">
            <button class="btn btn-primary" onclick="comicApp.openReader(comicApp.state.activeBook)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span>Read Now</span>
            </button>
            <button class="btn btn-secondary" onclick="comicApp.toggleFavorite('${book.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span>${isFav ? 'Saved in Library' : 'Add to Favorites'}</span>
            </button>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 12px;">Reader Community (${reviews.length} Reviews)</h4>
            <div id="reviewsList" style="max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
              ${reviews.length === 0 ? '<p style="font-size: 0.85rem; color: var(--text-dim);">No reviews yet. Be the first to share your thoughts!</p>' : 
                reviews.map(r => `
                  <div style="background: var(--bg-card); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.82rem;">
                    <strong>${this.escapeHTML(r.username)}</strong> (★ ${r.rating}) 
                    <span style="color: var(--text-dim); float: right;">${r.date}</span>
                    <p style="margin-top: 4px; color: var(--text-muted);">${this.escapeHTML(r.comment)}</p>
                  </div>
                `).join("")
              }
            </div>
            <form onsubmit="comicApp.handleReviewSubmit(event)" style="display: flex; gap: 8px;">
              <input type="text" id="reviewCommentInput" placeholder="Add a quick reader review..." style="flex: 1; padding: 6px 12px; border-radius: var(--radius-sm); background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main);" required>
              <button type="submit" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem;">Post</button>
            </form>
          </div>
        </div>
      </div>
    `;

    this.elements.detailModal.classList.add("active");
  }

  handleReviewSubmit(e) {
    e.preventDefault();
    const commentInput = document.getElementById("reviewCommentInput");
    if (!commentInput || !commentInput.value.trim() || !this.state.activeBook) return;

    this.api.addReview(this.state.activeBook.id, 5, commentInput.value.trim(), this.state.user);
    this.showToast("Review submitted successfully!", "success");
    this.openDetails(this.state.activeBook);
  }

  // --- AUTHENTICATION MODAL & LOGIC ---
  openAuthModal(tab = "login") {
    this.switchAuthTab(tab);
    this.elements.authModal.classList.add("active");
  }

  switchAuthTab(tab) {
    if (tab === "signup") {
      this.elements.authTabSignup.classList.add("active");
      this.elements.authTabLogin.classList.remove("active");
      this.elements.signupForm.style.display = "flex";
      this.elements.loginForm.style.display = "none";
    } else {
      this.elements.authTabLogin.classList.add("active");
      this.elements.authTabSignup.classList.remove("active");
      this.elements.loginForm.style.display = "flex";
      this.elements.signupForm.style.display = "none";
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById("loginIdentifier").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const session = await this.api.login(identifier, password);
      this.state.user = session;
      this.initAuthUI();
      this.closeAllModals();
      this.showToast(`Welcome back, ${session.username}!`, "success");
      this.render();
    } catch (err) {
      this.showToast(err.message || "Failed to sign in", "error");
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById("signupUsername").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      const session = await this.api.register(username, email, password);
      this.state.user = session;
      this.initAuthUI();
      this.closeAllModals();
      this.showToast(`Account created! Welcome, ${session.username}!`, "success");
      this.render();
    } catch (err) {
      this.showToast(err.message || "Failed to create account", "error");
    }
  }

  async handleDemoLogin() {
    try {
      const session = await this.api.login("demo@comicworld.org", "demo123");
      this.state.user = session;
      this.initAuthUI();
      this.closeAllModals();
      this.showToast("Signed in as Demo Reader (Full Access)", "success");
      this.render();
    } catch (err) {
      this.showToast("Demo login failed: " + err.message, "error");
    }
  }

  handleLogout() {
    this.api.logout();
    this.state.user = null;
    this.initAuthUI();
    this.showToast("You have been signed out.", "info");
    this.render();
  }

  // --- MODAL UTILS ---
  closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    if (this.elements.readerFrame) this.elements.readerFrame.src = "";
  }

  // --- TOAST NOTIFICATIONS ---
  showToast(message, type = "info") {
    if (!this.elements.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    let icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="11" x2="12" y2="17"></line><circle cx="12" cy="7.5" r="1.15" fill="currentColor" stroke="none"></circle></svg>`;
    if (type === "success") {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    }
    if (type === "error") {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `<span style="display:flex;align-items:center;">${icon}</span> <span>${this.escapeHTML(message)}</span>`;
    this.elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  render() {
    this.renderCatalog();
  }
}
