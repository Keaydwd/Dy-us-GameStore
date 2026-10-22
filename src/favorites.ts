import { createGameCard, type Game } from './shared';
import { showToast } from './toast';
import { wishlist, type SavedGame } from './wishlist';

type SortKey = 'recent' | 'name' | 'rating' | 'released';

const stats = document.querySelector<HTMLDivElement>('#fav-stats');
const statCount = document.querySelector<HTMLSpanElement>('#stat-count');
const statRating = document.querySelector<HTMLSpanElement>('#stat-rating');
const statGenre = document.querySelector<HTMLSpanElement>('#stat-genre');
const content = document.querySelector<HTMLDivElement>('#fav-content');
const emptyState = document.querySelector<HTMLDivElement>('#fav-empty');
const searchInput = document.querySelector<HTMLInputElement>('#fav-search');
const sortSelect = document.querySelector<HTMLSelectElement>('#fav-sort');
const clearBtn = document.querySelector<HTMLButtonElement>('#fav-clear');
const chipsBox = document.querySelector<HTMLDivElement>('#genre-chips');
const statusEl = document.querySelector<HTMLParagraphElement>('#fav-status');
const grid = document.querySelector<HTMLDivElement>('#fav-grid');

if (
    !stats ||
    !statCount ||
    !statRating ||
    !statGenre ||
    !content ||
    !emptyState ||
    !searchInput ||
    !sortSelect ||
    !clearBtn ||
    !chipsBox ||
    !statusEl ||
    !grid
) {
    throw new Error('The favorites page is missing required HTML elements.');
}

let query = '';
let sort: SortKey = 'recent';
let genre = '';
let firstRender = true;

const sorters: Record<SortKey, (a: SavedGame, b: SavedGame) => number> = {
    recent: (a, b) => b.savedAt - a.savedAt,
    name: (a, b) => a.name.localeCompare(b.name),
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    released: (a, b) => (b.released ?? '').localeCompare(a.released ?? ''),
};

function toGame(saved: SavedGame): Game {
    return {
        id: saved.id,
        name: saved.name,
        background_image: saved.image,
        rating: saved.rating,
        released: saved.released,
        genres: saved.genre ? [{ id: 0, name: saved.genre, slug: '' }] : undefined,
    };
}

function countGenres(list: SavedGame[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const game of list) {
        if (game.genre) counts.set(game.genre, (counts.get(game.genre) ?? 0) + 1);
    }
    return counts;
}

function renderStats(list: SavedGame[]): void {
    statCount!.textContent = String(list.length);

    const rated = list.filter((g) => typeof g.rating === 'number' && g.rating > 0);
    statRating!.textContent = rated.length
        ? (rated.reduce((sum, g) => sum + (g.rating ?? 0), 0) / rated.length).toFixed(1)
        : '—';

    const top = [...countGenres(list)].sort((a, b) => b[1] - a[1])[0];
    statGenre!.textContent = top ? top[0] : '—';
}

function renderChips(list: SavedGame[]): void {
    const counts = countGenres(list);
    if (genre && !counts.has(genre)) genre = '';

    const makeChip = (value: string, label: string): HTMLButtonElement => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = label;
        chip.setAttribute('aria-pressed', String(genre === value));
        chip.addEventListener('click', () => {
            genre = value;
            render();
        });
        return chip;
    };

    const chips = [makeChip('', `All ${list.length}`)];
    [...counts]
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => chips.push(makeChip(name, `${name} ${count}`)));

    chipsBox!.replaceChildren(...chips);
    chipsBox!.classList.toggle('hidden', counts.size === 0);
}

function render(): void {
    const all = wishlist.all();

    const isEmpty = all.length === 0;
    emptyState!.classList.toggle('hidden', !isEmpty);
    content!.classList.toggle('hidden', isEmpty);
    stats!.classList.toggle('hidden', isEmpty);

    if (isEmpty) {
        grid!.replaceChildren();
        return;
    }

    renderStats(all);
    renderChips(all);

    const needle = query.trim().toLowerCase();
    const visible = all
        .filter(
            (g) =>
                (!genre || g.genre === genre) && (!needle || g.name.toLowerCase().includes(needle)),
        )
        .sort(sorters[sort]);

    if (visible.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        const heading = document.createElement('h2');
        heading.textContent = 'No matches';
        const message = document.createElement('p');
        message.textContent = 'Try a different search or genre.';
        empty.append(heading, message);
        grid!.replaceChildren(empty);
        statusEl!.textContent = 'No saved games match your filters.';
        return;
    }

    const cards = visible.map((saved, index) => {
        const card = createGameCard(toGame(saved));
        if (firstRender) {
            card.classList.add('is-entering');
            card.style.setProperty('--i', String(Math.min(index, 12)));
        }
        return card;
    });

    grid!.replaceChildren(...cards);
    firstRender = false;

    statusEl!.textContent =
        visible.length === all.length
            ? `${all.length} saved ${all.length === 1 ? 'game' : 'games'}.`
            : `Showing ${visible.length} of ${all.length} saved games.`;
}

searchInput.addEventListener('input', () => {
    query = searchInput.value;
    render();
});

sortSelect.addEventListener('change', () => {
    sort = sortSelect.value as SortKey;
    render();
});

clearBtn.addEventListener('click', () => {
    const backup = wishlist.clear();
    showToast('Your archive was cleared', {
        label: 'Undo',
        onClick: () => wishlist.restore(backup),
    });
});

wishlist.subscribe(render);

render();