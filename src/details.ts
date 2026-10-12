interface GameDetails {
    name: string;
    description_raw: string;
    background_image: string;
    released: string;
    rating: number;
    website: string;
    developers?: { name: string }[];
    publishers?: { name: string }[];
    platforms?: { platform: { name: string } }[];
}

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api/games';

const detailsContainer = document.getElementById('game-details') as HTMLElement;
const globalLoadingState = document.getElementById('global-loading-state') as HTMLDivElement;
const errorState = document.getElementById('error-state') as HTMLDivElement;

async function fetchGameDetails(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    if (!gameId) {
        showError();
        return;
    }

    globalLoadingState.classList.remove('hidden');

    try {
        const response = await fetch(`${BASE_URL}/${gameId}?key=${API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch details');

        const data: GameDetails = await response.json();
        renderDetails(data);
    } catch (error) {
        showError();
    } finally {
        globalLoadingState.classList.add('hidden');
    }
}

function renderDetails(game: GameDetails): void {
    const imageUrl = game.background_image ? game.background_image : '';
    const developers = game.developers?.map(d => d.name).join(', ') || 'Unknown';
    const publishers = game.publishers?.map(p => p.name).join(', ') || 'Unknown';
    const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'N/A';

    document.title = `${game.name} - Dyēus Games`;

    detailsContainer.innerHTML = `
    <div class="details-top-nav">
      <a href="/" class="back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Store
      </a>
      <h1 class="details-main-title">${game.name}</h1>
    </div>
    
    <div class="details-grid">
      <div class="details-left">
        <img src="${imageUrl}" alt="${game.name}" class="details-main-image">
        <p class="details-description-text">${game.description_raw || 'No description available.'}</p>
      </div>
      
      <div class="details-right">
        <div class="details-info-card">
          <img src="${imageUrl}" class="details-card-logo" alt="">
          
          <div class="details-rating-box">
            <span>Rating</span>
            <strong>${game.rating} / 5</strong>
          </div>
          
          <div class="details-meta-row">
            <span class="meta-key">Developer</span>
            <span class="meta-value">${developers}</span>
          </div>
          
          <div class="details-meta-row">
            <span class="meta-key">Publisher</span>
            <span class="meta-value">${publishers}</span>
          </div>
          
          <div class="details-meta-row">
            <span class="meta-key">Release Date</span>
            <span class="meta-value">${game.released || 'TBA'}</span>
          </div>
          
          <div class="details-meta-row">
            <span class="meta-key">Platform</span>
            <span class="meta-value">${platforms}</span>
          </div>
          
          ${game.website ? `<a href="${game.website}" target="_blank" rel="noopener noreferrer" class="details-action-btn">Visit Website</a>` : ''}
        </div>
      </div>
    </div>
  `;

    detailsContainer.classList.remove('hidden');
}

function showError(): void {
    errorState.classList.remove('hidden');
}

fetchGameDetails();