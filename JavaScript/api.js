/**
 * Online Comics & Graphic Novels - Mock Backend API Service
 * Implements RESTful simulation, Web Crypto SHA-256 password hashing,
 * Multi-user LocalStorage persistence, Favorites, Reading History, and Reviews.
 * 
 * Author: Vishal S (CB.EN.U4CYS22075)
 */

class MockBackendService {
  constructor() {
    this.USERS_KEY = "comics_db_users_v2";
    this.SESSION_KEY = "comics_db_session_v2";
    this.RATINGS_KEY = "comics_db_reviews_v2";
    this._initDatabase();
  }

  // --- CRYPTO HELPER ---
  async _hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
      // Fallback simple hash if Web Crypto isn't available
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        hash = (hash << 5) - hash + password.charCodeAt(i);
        hash |= 0;
      }
      return "h_" + Math.abs(hash).toString(16);
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "_comics_salt_2024");
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // --- DATABASE INITIALIZATION ---
  async _initDatabase() {
    let users = this._getUsers();
    if (!users || users.length === 0) {
      const demoHash = await this._hashPassword("demo123");
      const vishalHash = await this._hashPassword("vishal123");

      const seedUsers = [
        {
          id: "usr_demo",
          username: "Demo Reader",
          email: "demo@comicworld.org",
          passwordHash: demoHash,
          avatar: "Images/profile.png",
          role: "member",
          createdAt: new Date().toISOString()
        },
        {
          id: "usr_vishal",
          username: "Vishal S",
          email: "vishal@amrita.edu",
          passwordHash: vishalHash,
          avatar: "Images/profile.png",
          role: "admin",
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(seedUsers));
    }
  }

  _getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  _saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // --- AUTHENTICATION API ---
  async register(username, email, password) {
    await this._simulateNetworkDelay(120);

    const cleanUsername = (username || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error("Username must be at least 3 characters long.");
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Please provide a valid email address.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const users = this._getUsers();
    const existing = users.find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email === cleanEmail
    );
    if (existing) {
      throw new Error("An account with this username or email already exists.");
    }

    const passwordHash = await this._hashPassword(password);
    const newUser = {
      id: "usr_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: passwordHash,
      avatar: "Images/profile.png",
      role: "member",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this._saveUsers(users);

    // Auto login on successful signup
    return this._createSession(newUser);
  }

  async login(identifier, password) {
    await this._simulateNetworkDelay(120);

    const cleanId = (identifier || "").trim().toLowerCase();
    const users = this._getUsers();
    const user = users.find(
      u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!user) {
      // Legacy backward-compatibility check: check old localStorage 'userData'
      const legacyDataStr = localStorage.getItem("userData");
      if (legacyDataStr) {
        try {
          const legacyData = JSON.parse(legacyDataStr);
          if (legacyData.username && legacyData.username.toLowerCase() === cleanId && legacyData.password === password) {
            // Upgrade legacy user into new system
            const passHash = await this._hashPassword(password);
            const upgradedUser = {
              id: "usr_legacy_" + Date.now().toString(36),
              username: legacyData.username,
              email: legacyData.email || `${legacyData.username}@comicworld.org`,
              passwordHash: passHash,
              avatar: "Images/profile.png",
              role: "member",
              createdAt: new Date().toISOString()
            };
            users.push(upgradedUser);
            this._saveUsers(users);
            return this._createSession(upgradedUser);
          }
        } catch (e) {
          // ignore error
        }
      }
      throw new Error("Invalid username or password.");
    }

    const passwordHash = await this._hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error("Invalid username or password.");
    }

    return this._createSession(user);
  }

  _createSession(user) {
    const session = {
      token: "tok_" + Math.random().toString(36).substr(2) + Date.now().toString(36),
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    // Also update legacy storage for backwards compatibility
    localStorage.setItem("userData", JSON.stringify({
      username: user.username,
      email: user.email,
      password: "●●●●●●"
    }));

    return session;
  }

  getCurrentSession() {
    try {
      const sessionStr = localStorage.getItem(this.SESSION_KEY);
      if (!sessionStr) return null;
      return JSON.parse(sessionStr);
    } catch (e) {
      return null;
    }
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    return true;
  }

  // --- FAVORITES & BOOKMARKS ---
  _getFavKey(userId) {
    return `comics_db_favs_${userId || "anon"}`;
  }

  getFavorites(userId) {
    if (!userId) {
      const session = this.getCurrentSession();
      userId = session ? session.userId : "guest";
    }
    try {
      return JSON.parse(localStorage.getItem(this._getFavKey(userId))) || [];
    } catch (e) {
      return [];
    }
  }

  toggleFavorite(bookId, userId) {
    if (!userId) {
      const session = this.getCurrentSession();
      if (!session) throw new Error("Please log in to add favorites to your library.");
      userId = session.userId;
    }
    let favs = this.getFavorites(userId);
    const index = favs.indexOf(bookId);
    let isAdded = false;
    if (index > -1) {
      favs.splice(index, 1);
      isAdded = false;
    } else {
      favs.push(bookId);
      isAdded = true;
    }
    localStorage.setItem(this._getFavKey(userId), JSON.stringify(favs));
    return { isAdded, count: favs.length, favorites: favs };
  }

  isFavorite(bookId, userId) {
    const favs = this.getFavorites(userId);
    return favs.includes(bookId);
  }

  // --- READING HISTORY ---
  _getHistoryKey(userId) {
    return `comics_db_hist_${userId || "anon"}`;
  }

  recordRead(bookId, userId) {
    if (!userId) {
      const session = this.getCurrentSession();
      userId = session ? session.userId : "guest";
    }
    try {
      let history = JSON.parse(localStorage.getItem(this._getHistoryKey(userId))) || [];
      // Remove existing entry for this book
      history = history.filter(item => item.bookId !== bookId);
      // Prepend newest read
      history.unshift({
        bookId: bookId,
        readAt: new Date().toISOString()
      });
      // Keep up to 20 recent
      if (history.length > 20) history = history.slice(0, 20);
      localStorage.setItem(this._getHistoryKey(userId), JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to record reading history", e);
    }
  }

  getReadingHistory(userId) {
    if (!userId) {
      const session = this.getCurrentSession();
      userId = session ? session.userId : "guest";
    }
    try {
      return JSON.parse(localStorage.getItem(this._getHistoryKey(userId))) || [];
    } catch (e) {
      return [];
    }
  }

  // --- REVIEWS & RATINGS ---
  getReviews(bookId) {
    try {
      const allReviews = JSON.parse(localStorage.getItem(this.RATINGS_KEY)) || {};
      return allReviews[bookId] || [];
    } catch (e) {
      return [];
    }
  }

  addReview(bookId, rating, comment, user) {
    try {
      const allReviews = JSON.parse(localStorage.getItem(this.RATINGS_KEY)) || {};
      if (!allReviews[bookId]) allReviews[bookId] = [];
      const newReview = {
        id: "rev_" + Date.now(),
        userId: user ? user.userId : "guest",
        username: user ? user.username : "Anonymous Reader",
        rating: Number(rating) || 5,
        comment: (comment || "").trim(),
        date: new Date().toLocaleDateString()
      };
      allReviews[bookId].unshift(newReview);
      localStorage.setItem(this.RATINGS_KEY, JSON.stringify(allReviews));
      return newReview;
    } catch (e) {
      console.warn("Failed to save review", e);
      return null;
    }
  }

  // --- CATALOG QUERY API ---
  async getCatalog(filters = {}) {
    await this._simulateNetworkDelay(50);
    let items = [...CATALOG_DATA];

    // Filter by type
    if (filters.type && filters.type !== "all") {
      items = items.filter(item => item.type === filters.type);
    }

    // Filter by genre
    if (filters.genre && filters.genre !== "all") {
      const targetGenre = filters.genre.toLowerCase();
      items = items.filter(item => 
        item.genres.some(g => g.toLowerCase() === targetGenre)
      );
    }

    // Filter by search query (title, author, or genre)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.genres.some(g => g.toLowerCase().includes(q))
      );
    }

    // Filter by language
    if (filters.language && filters.language !== "all") {
      items = items.filter(item => item.language.toLowerCase() === filters.language.toLowerCase());
    }

    // Filter by availability
    if (filters.availability && filters.availability !== "all") {
      items = items.filter(item => item.availability.toLowerCase() === filters.availability.toLowerCase());
    }

    // Sorting
    const sort = filters.sortBy || "featured";
    if (sort === "rating") {
      items.sort((a, b) => b.rating - a.rating);
    } else if (sort === "views") {
      items.sort((a, b) => b.views - a.views);
    } else if (sort === "newest") {
      items.sort((a, b) => b.year - a.year);
    } else if (sort === "title-asc") {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "title-desc") {
      items.sort((a, b) => b.title.localeCompare(a.title));
    } else {
      // featured
      items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
    }

    return items;
  }

  getBookById(id) {
    return CATALOG_DATA.find(item => item.id === id) || null;
  }

  getNews() {
    return NEWS_DATA;
  }

  _simulateNetworkDelay(ms = 80) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global Singleton Export
window.apiService = new MockBackendService();
