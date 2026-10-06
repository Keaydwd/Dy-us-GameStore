interface Game {
    id: number;
    name: string;
    background_image: string;
    rating: number;
    released: string;
}

interface ApiResponse {
    results: Game[];
}

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api/games';

const gamesGrid = document.getElementById('games-grid') as HTMLDivElement;
const loadingState = document.getElementById('loading-state') as HTMLDivElement;
const errorState = document.getElementById('error-state') as HTMLDivElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;

async function fetchGames(query: string = '', ordering: string = '-added', genres: string = ''): Promise<void> {
    try {
        gamesGrid.innerHTML = '';
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');

        let url = `${BASE_URL}?key=${API_KEY}&page_size=20&ordering=${ordering}`;
        if (query) url += `&search=${query}`;
        if (genres) url += `&genres=${genres}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');

        const data: ApiResponse = await response.json();
        renderGames(data.results);
    } catch (error) {
        errorState.classList.remove('hidden');
    } finally {
        loadingState.classList.add('hidden');
    }
}

function renderGames(games: Game[]): void {
    if (games.length === 0) {
        gamesGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No games found.</p>';
        return;
    }

    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';

        const imageUrl = game.background_image ? game.background_image : 'https://via.placeholder.com/400x200?text=No+Image';
        const releaseDate = game.released ? game.released : 'TBA';

        card.innerHTML = `
      <img src="${imageUrl}" alt="${game.name}" class="game-image">
      <div class="game-info">
        <h3 class="game-title">${game.name}</h3>
        <div class="game-meta">
          <span>⭐ ${game.rating}</span>
          <span>${releaseDate}</span>
        </div>
      </div>
    `;
        gamesGrid.appendChild(card);
    });
}

let debounceTimer: ReturnType<typeof setTimeout>;

searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const target = e.target as HTMLInputElement;
        fetchGames(target.value, sortSelect.value, genreSelect.value);
    }, 500);
});

sortSelect.addEventListener('change', () => {
    fetchGames(searchInput.value, sortSelect.value, genreSelect.value);
});

genreSelect.addEventListener('change', () => {
    fetchGames(searchInput.value, sortSelect.value, genreSelect.value);
});

fetchGames();