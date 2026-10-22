import { wishlist, type SavedGame } from './wishlist';
import { showToast } from './toast';

export interface Game {
    id: number;
    name: string;
    background_image: string | null;
    rating: number | null;
    released: string | null;
    genres?: { id: number; name: string; slug: string }[];
}

export interface Developer {
    id: number;
    name: string;
    slug: string;
    games_count: number;
    image_background: string | null;
    description?: string;
    games?: { id: number; name: string; slug: string; added: number }[];
}

export interface Paged<T> {
    results: T[];
    next: string | null;
}

export const API_KEY = import.meta.env.VITE_RAWG_API_KEY as string | undefined;
const BASE_URL = 'https://api.rawg.io/api';

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number) {
        super(`Request failed with status ${status}`);
        this.name = 'ApiError';
        this.status = status;
    }
}

export async function api<T>(
    path: string,
    params: Record<string, string> = {},
    signal?: AbortSignal,
): Promise<T> {
    if (!API_KEY) throw new Error('Missing API key');

    const query = new URLSearchParams({ key: API_KEY, ...params });
    const response = await fetch(`${BASE_URL}${path}?${query.toString()}`, { signal });

    if (!response.ok) throw new ApiError(response.status);
    return response.json() as Promise<T>;
}

export function setSizedImage(img: HTMLImageElement, url: string, width: number): void {
    const resized = url.includes('/media/games/')
        ? url.replace('/media/games/', `/media/resize/${width}/-/games/`)
        : url;

    img.src = resized;

    img.addEventListener('error', () => {
        if (img.src !== url) img.src = url;
        else img.classList.add('image-unavailable');
    });
}

export function formatCount(value: number): string {
    return new Intl.NumberFormat('en').format(value);
}

export function htmlToText(html: string): string {
    const prepared = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
    const doc = new DOMParser().parseFromString(prepared, 'text/html');
    doc.querySelectorAll('script, style').forEach((node) => node.remove());
    return (doc.body.textContent ?? '').trim();
}

const HEART_SVG =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2 0 3.4 1.1 4 2.3h4C14.6 6.1 16 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21z"/></svg>';

export function toSavedGame(game: Game): SavedGame {
    return {
        id: game.id,
        name: game.name,
        image: game.background_image,
        rating: game.rating,
        released: game.released,
        genre: game.genres?.[0]?.name ?? null,
        savedAt: Date.now(),
    };
}

function syncSaveButton(button: HTMLButtonElement): void {
    const saved = wishlist.has(Number(button.dataset.id));
    const name = button.dataset.name ?? 'game';

    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute(
        'aria-label',
        saved ? `Remove ${name} from My Archive` : `Save ${name} to My Archive`,
    );

    const label = button.querySelector('.save-btn-label');
    if (label) label.textContent = saved ? 'Saved' : 'Save to archive';
}

export function createSaveButton(game: Game, labeled = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = labeled ? 'save-btn save-btn-wide' : 'save-btn';
    button.dataset.id = String(game.id);
    button.dataset.name = game.name;

    const icon = document.createElement('span');
    icon.className = 'save-btn-icon';
    icon.innerHTML = HEART_SVG;
    button.appendChild(icon);

    if (labeled) {
        const label = document.createElement('span');
        label.className = 'save-btn-label';
        button.appendChild(label);
    }

    button.addEventListener('click', () => {
        const removed = wishlist.has(game.id) ? wishlist.remove(game.id) : undefined;

        if (removed) {
            showToast(`Removed “${removed.name}”`, {
                label: 'Undo',
                onClick: () => wishlist.add(removed),
            });
            return;
        }

        wishlist.add(toSavedGame(game));
        button.classList.remove('is-popping');
        void button.offsetWidth;
        button.classList.add('is-popping');

        showToast(`Saved “${game.name}” to My Archive`, {
            label: 'View',
            onClick: () => {
                window.location.href = './favorites.html';
            },
        });
    });

    syncSaveButton(button);
    return button;
}

function syncAll(): void {
    document.querySelectorAll<HTMLButtonElement>('.save-btn').forEach(syncSaveButton);

    const count = wishlist.all().length;
    document.querySelectorAll<HTMLElement>('[data-wishlist-count]').forEach((badge) => {
        badge.textContent = String(count);
        badge.hidden = count === 0;
    });
}

wishlist.subscribe(syncAll);
syncAll();

export function createGameCard(game: Game): HTMLElement {
    const shell = document.createElement('div');
    shell.className = 'game-card-shell';

    const card = document.createElement('a');
    card.className = 'game-card';
    card.href = `./details.html?id=${encodeURIComponent(String(game.id))}`;
    card.setAttribute('aria-label', `View details for ${game.name}`);

    const wrapper = document.createElement('div');
    wrapper.className = 'game-image-wrapper';

    const image = document.createElement('img');
    image.className = 'game-image';
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';

    if (game.background_image) setSizedImage(image, game.background_image, 640);
    else image.classList.add('image-unavailable');

    wrapper.appendChild(image);

    const content = document.createElement('div');
    content.className = 'game-card-content';

    const category = document.createElement('span');
    category.className = 'game-subtitle';
    category.textContent = game.genres?.[0]?.name ?? 'Video Game';

    const title = document.createElement('h3');
    title.className = 'game-title';
    title.textContent = game.name;

    const meta = document.createElement('div');
    meta.className = 'game-card-meta';

    const rating = document.createElement('span');
    rating.className = 'game-rating';
    if (typeof game.rating === 'number' && game.rating > 0) {
        const star = document.createElement('span');
        star.className = 'rating-symbol';
        star.textContent = '✳';
        rating.append(star, game.rating.toFixed(1));
    } else {
        rating.textContent = 'Not rated';
    }

    const release = document.createElement('span');
    release.className = 'game-release';
    release.textContent = game.released ? game.released.slice(0, 4) : 'TBA';

    meta.append(rating, release);
    content.append(category, title, meta);
    card.append(wrapper, content);

    shell.append(card, createSaveButton(game));
    return shell;
}