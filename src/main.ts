interface Game {
    id: number;
    name: string;
    background_image: string;
    rating: number;
}

interface ApiResponse {
    results: Game[];
    next: string | null;
}

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api/games';

const gamesGrid = document.getElementById('games-grid') as HTMLDivElement;
const loadingState = document.getElementById('loading-state') as HTMLDivElement;
const errorState = document.getElementById('error-state') as HTMLDivElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;
const resetFiltersBtn = document.getElementById('reset-filters') as HTMLButtonElement;
const sidebar = document.getElementById('sidebar') as HTMLElement;
const scrollTrigger = document.getElementById('scroll-trigger') as HTMLDivElement;
const moreLoader = document.getElementById('more-loader') as HTMLDivElement;

let currentPage = 1;
let isFetching = false;
let hasMore = true;
let currentQuery = '';
let currentOrdering = '-added';
let currentGenres = '';

async function fetchGames(query: string = '', ordering: string = '-added', genres: string = '', isAppend: boolean = false): Promise<void> {
    if (isFetching || (!hasMore && isAppend)) return;
    isFetching = true;

    currentQuery = query;
    currentOrdering = ordering;
    currentGenres = genres;

    if (!isAppend) {
        currentPage = 1;
        hasMore = true;
        gamesGrid.innerHTML = '';
        loadingState.classList.remove('hidden');
        sidebar.classList.add('hidden');
    } else {
        moreLoader.classList.remove('hidden');
    }

    errorState.classList.add('hidden');

    try {
        let url = `${BASE_URL}?key=${API_KEY}&page_size=24&ordering=${ordering}&page=${currentPage}`;
        if (query) url += `&search=${query}`;
        if (genres) url += `&genres=${genres}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');

        const data: ApiResponse = await response.json();

        if (!data.next || data.results.length === 0) {
            hasMore = false;
        }

        renderGames(data.results, isAppend);
    } catch (error) {
        errorState.classList.remove('hidden');
    } finally {
        isFetching = false;
        loadingState.classList.add('hidden');
        moreLoader.classList.add('hidden');
        if (!isAppend) sidebar.classList.remove('hidden');
    }
}

function renderGames(games: Game[], isAppend: boolean): void {
    if (!isAppend && games.length === 0) {
        gamesGrid.innerHTML = '<p>No results found.</p>';
        return;
    }

    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';

        const imageUrl = game.background_image ? game.background_image : '';

        card.innerHTML = `
      <div class="game-image-wrapper">
        <img src="${imageUrl}" alt="${game.name}" class="game-image" loading="lazy">
      </div>
      <span class="game-subtitle">Base Game</span>
      <h3 class="game-title">${game.name}</h3>
      <span class="game-price">Rating: ${game.rating}</span>
    `;
        gamesGrid.appendChild(card);
    });
}

let debounceTimer: ReturnType<typeof setTimeout>;

searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const target = e.target as HTMLInputElement;
        fetchGames(target.value, sortSelect.value, genreSelect.value, false);
    }, 500);
});

sortSelect.addEventListener('change', () => {
    fetchGames(searchInput.value, sortSelect.value, genreSelect.value, false);
});

genreSelect.addEventListener('change', () => {
    fetchGames(searchInput.value, sortSelect.value, genreSelect.value, false);
});

resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    sortSelect.value = '-added';
    genreSelect.value = '';
    fetchGames();
});

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore && !isFetching) {
        currentPage++;
        fetchGames(currentQuery, currentOrdering, currentGenres, true);
    }
}, { rootMargin: '100px' });

observer.observe(scrollTrigger);

fetchGames();