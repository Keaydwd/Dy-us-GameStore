import {
    api,
    createGameCard,
    formatCount,
    htmlToText,
    setSizedImage,
    type Developer,
    type Game,
    type Paged,
} from './shared';

const root = document.querySelector<HTMLDivElement>('#developer-root');
if (!root) throw new Error('The developer page is missing #developer-root.');

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    text?: string,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function showError(heading: string, message: string): void {
    const box = el('div', 'error-container');
    const link = el('a', 'error-back-link', '← Back to developers');
    link.href = './developers.html';
    box.append(el('h1', 'error-heading', heading), el('p', 'error-message', message), link);
    root!.replaceChildren(box);
}

function metaRow(key: string, value: string): HTMLDivElement {
    const row = el('div', 'details-meta-row');
    row.append(el('span', 'meta-key', key), el('span', 'meta-value', value));
    return row;
}

function render(dev: Developer, games: Game[]): void {
    document.title = `${dev.name} | Dyēus Games`;

    // Верхня навігація
    const top = el('div', 'details-top-nav');
    const back = el('a', 'back-link');
    back.href = './developers.html';
    back.append(el('span', 'back-arrow', '←'), 'Back to developers');
    top.append(
        back,
        el('p', 'details-eyebrow', 'DEVELOPER'),
        el('h1', 'details-main-title', dev.name),
    );

    // Ліва колонка
    const hero = el('div', 'details-hero');
    if (dev.image_background) {
        const img = el('img', 'details-main-image');
        img.alt = '';
        img.decoding = 'async';
        setSizedImage(img, dev.image_background, 1280);
        hero.appendChild(img);
    }

    const description = el('div', 'details-description');
    const text = dev.description ? htmlToText(dev.description) : '';
    description.appendChild(
        el(
            'p',
            'details-description-text',
            text || 'No description is available for this studio yet.',
        ),
    );

    const left = el('div', 'details-left');
    left.append(hero, description);

    // Права колонка
    const card = el('div', 'details-info-card');

    const ratingBox = el('div', 'details-rating-box');
    ratingBox.append(
        el('span', 'rating-label', 'Games released'),
        el('span', 'rating-value', formatCount(dev.games_count)),
    );

    const metadata = el('div', 'details-metadata');
    if (games[0]) metadata.appendChild(metaRow('Most popular', games[0].name));
    metadata.appendChild(metaRow('Source', 'RAWG'));

    const action = el('a', 'details-action-btn', 'View on RAWG ↗');
    action.href = `https://rawg.io/developers/${encodeURIComponent(dev.slug)}`;
    action.target = '_blank';
    action.rel = 'noopener noreferrer';

    card.append(ratingBox, metadata, action);
    const right = el('div', 'details-right');
    right.appendChild(card);

    const grid = el('div', 'details-grid');
    grid.append(left, right);

    // Найвідоміші проєкти
    const projects = el('section', 'dev-projects');
    projects.setAttribute('aria-labelledby', 'projects-title');

    const intro = el('div', 'section-intro');
    const introText = el('div');
    const eyebrow = el('p', 'eyebrow', 'MOST POPULAR WORKS');
    const heading = el('h2', undefined, 'Worlds they built.');
    heading.id = 'projects-title';
    introText.append(eyebrow, heading);
    intro.appendChild(introText);

    projects.appendChild(intro);

    if (games.length > 0) {
        const list = el('div', 'games-grid dev-games');
        games.forEach((game) => list.appendChild(createGameCard(game)));
        projects.appendChild(list);
    } else {
        projects.appendChild(el('p', 'dev-empty', 'No projects found for this studio.'));
    }

    root!.replaceChildren(top, grid, projects);
}

async function init(): Promise<void> {
    const id = new URLSearchParams(window.location.search).get('id');

    if (!id) {
        showError('Studio not found', 'No studio was selected.');
        return;
    }

    try {
        const [dev, gamesPage] = await Promise.all([
            api<Developer>(`/developers/${encodeURIComponent(id)}`),
            api<Paged<Game>>('/games', {
                developers: id,
                ordering: '-added',
                page_size: '12',
            }),
        ]);

        render(dev, gamesPage.results);
    } catch (error) {
        console.error('Unable to load developer:', error);
        showError(
            'Something went wrong',
            'The studio could not be loaded. Please try again later.',
        );
    }
}

void init();
