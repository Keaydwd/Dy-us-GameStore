import { API_KEY, api, createGameCard, type Game, type Paged } from './shared';
import { initFeatured } from './featured';

const PAGE_SIZE = '24';

function getRequiredElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Missing required element: ${selector}`);
    }

    return element;
}

const gamesGrid = getRequiredElement<HTMLDivElement>('#games-grid');
const globalLoader = getRequiredElement<HTMLDivElement>('#global-loading-state');
const errorState = getRequiredElement<HTMLDivElement>('#error-state');
const searchInput = getRequiredElement<HTMLInputElement>('#search-input');
const sortSelect = getRequiredElement<HTMLSelectElement>('#sort-select');
const genreSelect = getRequiredElement<HTMLSelectElement>('#genre-select');
const resetFiltersBtn = getRequiredElement<HTMLButtonElement>('#reset-filters');
const scrollTrigger = getRequiredElement<HTMLDivElement>('#scroll-trigger');
const moreLoader = getRequiredElement<HTMLDivElement>('#more-loader');
const resultsStatus = getRequiredElement<HTMLParagraphElement>('#results-status');

if (
    !gamesGrid ||
    !globalLoader ||
    !errorState ||
    !searchInput ||
    !sortSelect ||
    !genreSelect ||
    !resetFiltersBtn ||
    !scrollTrigger ||
    !moreLoader ||
    !resultsStatus
) {
    throw new Error('The catalog page is missing required HTML elements.');
}

let currentPage = 1;
let hasMore = true;
let isFetching = false;
let currentQuery = '';
let currentOrdering = '-added';
let currentGenres = '';

let listController: AbortController | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

function setStatus(message: string): void {
    resultsStatus.textContent = message;
}

function setError(message: string): void {
    errorState.textContent = message;
    errorState.classList.remove('hidden');
}

function clearError(): void {
    errorState.textContent = '';
    errorState.classList.add('hidden');
}

function renderGames(games: Game[], append: boolean): void {
    if (!append) {
        gamesGrid.replaceChildren();
    }

    if (games.length === 0 && !append) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';

        const heading = document.createElement('h2');
        heading.textContent = 'No games found';

        const message = document.createElement('p');
        message.textContent = 'Try a different search or adjust your filters.';

        emptyState.append(heading, message);
        gamesGrid.appendChild(emptyState);

        setStatus('No games found.');
        return;
    }

    const fragment = document.createDocumentFragment();
    for (const game of games) {
        fragment.appendChild(createGameCard(game));
    }
    gamesGrid.appendChild(fragment);

    setStatus(`${gamesGrid.querySelectorAll('.game-card').length} games loaded.`);
}

async function fetchGames(append = false): Promise<void> {
    if (isFetching || (append && !hasMore)) {
        return;
    }

    if (!API_KEY) {
        clearError();
        setError('The game catalog is not configured. Please try again later.');
        setStatus('Catalog unavailable.');
        return;
    }

    if (!append) {
        listController?.abort();
        currentPage = 1;
        hasMore = true;

        globalLoader.classList.remove('hidden');
        scrollTrigger.classList.add('hidden');
        clearError();
        setStatus('Loading games...');
    } else {
        moreLoader.classList.remove('hidden');
    }

    listController = new AbortController();
    const controller = listController;
    const requestedPage = currentPage;

    isFetching = true;

    try {
        const params: Record<string, string> = {
            page_size: PAGE_SIZE,
            page: String(requestedPage),
            ordering: currentOrdering,
        };

        if (currentQuery.trim()) params.search = currentQuery.trim();
        if (currentGenres) params.genres = currentGenres;

        const data = await api<Paged<Game>>('/games', params, controller.signal);

        if (!Array.isArray(data.results)) {
            throw new Error('The API returned an invalid game list.');
        }

        if (controller.signal.aborted || controller !== listController) {
            return;
        }

        renderGames(data.results, append);

        currentPage = requestedPage + 1;
        hasMore = Boolean(data.next) && data.results.length > 0;

        if (!hasMore) {
            setStatus(
                data.results.length === 0 && append
                    ? 'You have reached the end of the catalog.'
                    : `${gamesGrid.querySelectorAll('.game-card').length} games loaded. You have reached the end.`,
            );
        }

        scrollTrigger.classList.toggle('hidden', !hasMore);
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            return;
        }

        if (controller !== listController) {
            return;
        }

        console.error('Unable to load games:', error);

        if (append) {
            setError('More games could not be loaded. Scroll again to retry.');
        } else {
            gamesGrid.replaceChildren();
            setError('The catalog could not be loaded. Check your connection and try again.');
        }

        setStatus('Unable to load games.');
    } finally {
        if (controller === listController) {
            isFetching = false;
            globalLoader.classList.add('hidden');
            moreLoader.classList.add('hidden');
        }
    }
}

function applyFilters(): void {
    currentQuery = searchInput.value.trim();
    currentOrdering = sortSelect.value;
    currentGenres = genreSelect.value;

    void fetchGames(false);
}

searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);

    listController?.abort();
    isFetching = false;

    debounceTimer = setTimeout(applyFilters, 350);
});

sortSelect.addEventListener('change', applyFilters);
genreSelect.addEventListener('change', applyFilters);

resetFiltersBtn.addEventListener('click', () => {
    clearTimeout(debounceTimer);

    searchInput.value = '';
    sortSelect.value = '-added';
    genreSelect.value = '';

    applyFilters();
});

const observer = new IntersectionObserver(
    (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetching) {
            void fetchGames(true);
        }
    },
    { rootMargin: '300px 0px' },
);

observer.observe(scrollTrigger);

void initFeatured();
void fetchGames();