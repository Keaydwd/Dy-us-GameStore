import { API_KEY, ApiError, api, createSaveButton, type Game } from './shared';

interface GameDetails {
    id: number;
    name: string;
    description_raw: string | null;
    background_image: string | null;
    background_image_additional?: string | null;
    released: string | null;
    rating: number | null;
    website: string | null;
    developers?: { name: string }[];
    publishers?: { name: string }[];
    platforms?: { platform: { name: string } }[];
    genres?: { name: string }[];
    metacritic?: number | null;
    playtime?: number | null;
}

const detailsContainer = document.querySelector<HTMLElement>('#game-details');
const globalLoader = document.querySelector<HTMLDivElement>('#global-loading-state');
const errorState = document.querySelector<HTMLDivElement>('#error-state');

if (!detailsContainer || !globalLoader || !errorState) {
    throw new Error('The game details page is missing required HTML elements.');
}

function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className: string,
    text?: string,
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    element.className = className;

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function createMetadataRow(label: string, value: string): HTMLDivElement {
    const row = createElement('div', 'details-meta-row');
    row.append(createElement('span', 'meta-key', label), createElement('span', 'meta-value', value));
    return row;
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Unknown';
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

function createWebsiteLink(website: string | null): HTMLAnchorElement | null {
    if (!website) return null;

    try {
        const url = new URL(website);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

        const link = createElement('a', 'details-action-btn', 'Visit official website');
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        return link;
    } catch {
        return null;
    }
}
function renderDetails(game: GameDetails): void {
    detailsContainer!.replaceChildren();

    document.title = `${game.name} | Dyēus Games`;

    const summary = game.description_raw?.trim().slice(0, 155);
    if (summary) {
        document.querySelector('meta[name="description"]')?.setAttribute('content', summary);
    }

    const topNav = createElement('div', 'details-top-nav');
    const backLink = createElement('a', 'back-link', 'Back to the collection');
    backLink.href = './index.html';

    const arrow = createElement('span', 'back-arrow', '←');
    arrow.setAttribute('aria-hidden', 'true');
    backLink.prepend(arrow);

    topNav.append(
        backLink,
        createElement('p', 'details-eyebrow', 'THE GAME ARCHIVE'),
        createElement('h1', 'details-main-title', game.name),
    );

    const layout = createElement('div', 'details-grid');
    const mainColumn = createElement('div', 'details-left');
    const sideColumn = createElement('aside', 'details-right');

    const hero = createElement('div', 'details-hero');
    hero.setAttribute('aria-label', `${game.name} artwork`);

    if (game.background_image) {
        const image = createElement('img', 'details-main-image');
        image.src = game.background_image;
        image.alt = `${game.name} artwork`;
        image.loading = 'eager';
        image.decoding = 'async';

        image.addEventListener(
            'error',
            () => {
                image.remove();
                hero.classList.add('image-unavailable');
            },
            { once: true },
        );

        hero.appendChild(image);
    } else {
        hero.classList.add('image-unavailable');
    }

    const descriptionSection = createElement('section', 'details-description');
    descriptionSection.append(
        createElement('h2', 'section-heading', 'About the game'),
        createElement(
            'p',
            'details-description-text',
            game.description_raw?.trim() || 'No description is available for this game yet.',
        ),
    );

    const infoCard = createElement('div', 'details-info-card');

    const ratingBox = createElement('div', 'details-rating-box');
    ratingBox.append(
        createElement('span', 'rating-label', 'Community rating'),
        createElement(
            'strong',
            'rating-value',
            typeof game.rating === 'number' && game.rating > 0
                ? `${game.rating.toFixed(1)} / 5`
                : 'Not rated',
        ),
    );

    const metadata = createElement('div', 'details-metadata');
    metadata.append(
        createMetadataRow(
            'Developer',
            game.developers?.map((developer) => developer.name).join(', ') || 'Unknown',
        ),
        createMetadataRow(
            'Publisher',
            game.publishers?.map((publisher) => publisher.name).join(', ') || 'Unknown',
        ),
        createMetadataRow('Release date', formatDate(game.released)),
        createMetadataRow(
            'Platforms',
            game.platforms?.map((item) => item.platform.name).join(', ') || 'Unknown',
        ),
        createMetadataRow('Genres', game.genres?.map((genre) => genre.name).join(', ') || 'Unknown'),
        createMetadataRow(
            'Metacritic',
            typeof game.metacritic === 'number' ? String(game.metacritic) : 'Not available',
        ),
        createMetadataRow(
            'Average playtime',
            typeof game.playtime === 'number' && game.playtime > 0
                ? `${game.playtime} hours`
                : 'Not available',
        ),
    );

    infoCard.append(createElement('p', 'details-eyebrow', 'AT A GLANCE'), ratingBox, metadata);

    const savable: Game = {
        id: game.id,
        name: game.name,
        background_image: game.background_image,
        rating: game.rating,
        released: game.released,
        genres: game.genres?.map((genre, index) => ({ id: index, name: genre.name, slug: '' })),
    };

    const saveButton = createSaveButton(savable, true);
    saveButton.classList.add('details-save');
    infoCard.appendChild(saveButton);

    if (game.website) {
        const websiteLink = createWebsiteLink(game.website);
        if (websiteLink) infoCard.appendChild(websiteLink);

        mainColumn.append(hero, descriptionSection);
        sideColumn.appendChild(infoCard);
        layout.append(mainColumn, sideColumn);
        detailsContainer!.append(topNav, layout);
        detailsContainer!.classList.remove('hidden');
    }

    mainColumn.append(hero, descriptionSection);
    sideColumn.appendChild(infoCard);
    layout.append(mainColumn, sideColumn);
    detailsContainer!.append(topNav, layout);
    detailsContainer!.classList.remove('hidden');
}

function showError(message: string): void {
    detailsContainer!.classList.add('hidden');
    errorState!.replaceChildren();

    const backLink = createElement('a', 'error-back-link', 'Return to the collection');
    backLink.href = './index.html';

    errorState!.append(
        createElement('h2', 'error-heading', 'The archive is unavailable'),
        createElement('p', 'error-message', message),
        backLink,
    );
    errorState!.classList.remove('hidden');
}

async function fetchGameDetails(): Promise<void> {
    const gameId = new URLSearchParams(window.location.search).get('id');

    if (!gameId || !/^\d+$/.test(gameId) || Number(gameId) <= 0) {
        showError(
            'The requested game could not be identified. Return to the collection and select a game.',
        );
        globalLoader!.classList.add('hidden');
        return;
    }

    if (!API_KEY) {
        showError('The game archive is not configured. Please try again later.');
        globalLoader!.classList.add('hidden');
        return;
    }

    globalLoader!.classList.remove('hidden');
    errorState!.classList.add('hidden');
    detailsContainer!.classList.add('hidden');

    try {
        const game = await api<GameDetails>(`/games/${encodeURIComponent(gameId)}`);

        if (!game || typeof game.name !== 'string' || !game.name.trim()) {
            showError('The game information returned by the archive is incomplete.');
            return;
        }

        renderDetails(game);
    } catch (error: unknown) {
        console.error('Unable to load game details:', error);

        if (error instanceof ApiError) {
            showError(
                error.status === 404
                    ? 'This game could not be found. It may no longer be available.'
                    : 'Game details could not be loaded. Please try again later.',
            );
        } else {
            showError('A network error occurred. Check your connection and try again.');
        }
    } finally {
        globalLoader!.classList.add('hidden');
    }
}

void fetchGameDetails();