import { api, setSizedImage, formatCount, type Developer, type Paged } from './shared';

const TOP_SLUGS = [
    'rockstar-games',
    'naughty-dog',
    'cd-projekt-red',
    'valve-software',
    'fromsoftware',
    'capcom',
    'bethesda-game-studios',
    'santa-monica-studio',
    'larian-studios',
    'insomniac-games',
    'remedy-entertainment',
    'ubisoft-montreal',
];

const PAGE_SIZE = 12;

const topSection = document.querySelector<HTMLDivElement>('#top-section');
const topGrid = document.querySelector<HTMLDivElement>('#top-grid');
const grid = document.querySelector<HTMLDivElement>('#devs-grid');
const statusEl = document.querySelector<HTMLParagraphElement>('#devs-status');
const errorEl = document.querySelector<HTMLDivElement>('#devs-error');
const loader = document.querySelector<HTMLDivElement>('#devs-loader');
const loadMoreBtn = document.querySelector<HTMLButtonElement>('#load-more');

if (!topSection || !topGrid || !grid || !statusEl || !errorEl || !loader || !loadMoreBtn) {
    throw new Error('The developers page is missing required HTML elements.');
}

let page = 1;
let hasMore = true;
let isFetching = false;

function createDeveloperCard(dev: Developer): HTMLAnchorElement {
    const card = document.createElement('a');
    card.className = 'dev-card';
    card.href = `./developer.html?id=${encodeURIComponent(String(dev.id))}`;
    card.setAttribute('aria-label', `View ${dev.name}`);

    const image = document.createElement('img');
    image.className = 'dev-card-image';
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    if (dev.image_background) setSizedImage(image, dev.image_background, 640);

    const content = document.createElement('div');
    content.className = 'dev-card-content';

    const count = document.createElement('span');
    count.className = 'dev-card-count';
    count.textContent = `${formatCount(dev.games_count)} games`;

    const name = document.createElement('h3');
    name.className = 'dev-card-name';
    name.textContent = dev.name;

    content.append(count, name);

    const popular = dev.games?.slice(0, 3).map((g) => g.name);
    if (popular && popular.length > 0) {
        const known = document.createElement('p');
        known.className = 'dev-card-known';
        known.textContent = `Known for ${popular.join(', ')}`;
        content.appendChild(known);
    }

    const arrow = document.createElement('span');
    arrow.className = 'dev-card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    card.append(image, content, arrow);
    return card;
}

async function loadTopStudios(): Promise<void> {
    const results = await Promise.allSettled(
        TOP_SLUGS.map((slug) => api<Developer>(`/developers/${slug}`)),
    );

    const developers = results
        .filter((r): r is PromiseFulfilledResult<Developer> => r.status === 'fulfilled')
        .map((r) => r.value);

    if (developers.length === 0) {
        topSection!.classList.add('hidden');
        return;
    }

    const fragment = document.createDocumentFragment();
    developers.forEach((dev) => fragment.appendChild(createDeveloperCard(dev)));
    topGrid!.appendChild(fragment);
}

async function loadArchivePage(): Promise<void> {
    if (isFetching || !hasMore) return;

    isFetching = true;
    loadMoreBtn!.classList.add('hidden');
    loader!.classList.remove('hidden');
    errorEl!.classList.add('hidden');

    try {
        const data = await api<Paged<Developer>>('/developers', {
            page: String(page),
            page_size: String(PAGE_SIZE),
        });

        const fragment = document.createDocumentFragment();
        data.results.forEach((dev) => fragment.appendChild(createDeveloperCard(dev)));
        grid!.appendChild(fragment);

        page += 1;
        hasMore = Boolean(data.next) && data.results.length > 0;

        const total = grid!.querySelectorAll('.dev-card').length;
        statusEl!.textContent = hasMore
            ? `${total} studios loaded.`
            : `${total} studios loaded. You have reached the end.`;
    } catch (error) {
        console.error('Unable to load developers:', error);
        errorEl!.textContent = 'Studios could not be loaded. Check your connection and try again.';
        errorEl!.classList.remove('hidden');
        statusEl!.textContent = 'Unable to load studios.';
    } finally {
        isFetching = false;
        loader!.classList.add('hidden');
        loadMoreBtn!.classList.toggle('hidden', !hasMore);
    }
}

loadMoreBtn.addEventListener('click', () => void loadArchivePage());

void loadTopStudios();
void loadArchivePage();