import { API_KEY, api, setSizedImage, type Game, type Paged } from './shared';

const SLIDE_DURATION = 6000;
const FEATURED_COUNT = 6;

export async function initFeatured(): Promise<void> {
    const root = document.querySelector<HTMLElement>('#featured');
    const slidesBox = document.querySelector<HTMLDivElement>('#featured-slides');
    const thumbsBox = document.querySelector<HTMLDivElement>('#featured-list');
    const prevBtn = document.querySelector<HTMLButtonElement>('#featured-prev');
    const nextBtn = document.querySelector<HTMLButtonElement>('#featured-next');
    const toggleBtn = document.querySelector<HTMLButtonElement>('#featured-toggle');

    if (!root || !slidesBox || !thumbsBox) {
        console.error('Featured carousel: required elements are missing in index.html.');
        return;
    }

    const showError = (message: string): void => {
        root.classList.remove('is-loading');
        const p = document.createElement('p');
        p.className = 'featured-error';
        p.textContent = message;
        slidesBox.replaceChildren(p);
        if (toggleBtn) toggleBtn.hidden = true;
    };

    if (!API_KEY) {
        showError('Featured games are unavailable.');
        return;
    }

    let games: Game[];

    try {
        const data = await api<Paged<Game>>('/games', { page_size: '12', ordering: '-added' });
        games = data.results.filter((g) => g.background_image).slice(0, FEATURED_COUNT);
        if (games.length === 0) throw new Error('No games');
    } catch (error) {
        console.error('Featured error:', error);
        showError('Unable to load featured games.');
        return;
    }

    const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.style.setProperty('--slide-duration', `${SLIDE_DURATION}ms`);
    if (toggleBtn) toggleBtn.hidden = !autoplay;

    const slides: HTMLElement[] = [];
    const thumbs: HTMLButtonElement[] = [];
    let current = 0;

    function goTo(index: number): void {
        current = (index + games.length) % games.length;

        slides.forEach((slide, i) => {
            const active = i === current;
            slide.classList.toggle('is-active', active);
            slide.toggleAttribute('inert', !active);
            slide.setAttribute('aria-hidden', String(!active));
        });

        thumbs.forEach((thumb, i) => {
            const active = i === current;
            thumb.classList.toggle('is-active', active);
            thumb.setAttribute('aria-current', String(active));

            const bar = thumb.querySelector<HTMLElement>('.thumb-progress');
            if (!bar) return;
            bar.classList.remove('is-running');
            void bar.offsetWidth;
            if (active && autoplay) bar.classList.add('is-running');
        });
    }

    games.forEach((game, i) => {
        const image = game.background_image as string;

        const slide = document.createElement('article');
        slide.className = 'featured-slide';
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${i + 1} of ${games.length}`);

        const img = document.createElement('img');
        img.className = 'featured-image';
        img.alt = '';
        img.decoding = 'async';
        setSizedImage(img, image, 1280);

        const shade = document.createElement('div');
        shade.className = 'featured-shade';

        const content = document.createElement('div');
        content.className = 'featured-content';

        const eyebrow = document.createElement('span');
        eyebrow.className = 'featured-eyebrow';
        eyebrow.textContent = game.genres?.[0]?.name ?? 'Video Game';

        const title = document.createElement('h2');
        title.className = 'featured-title';
        title.textContent = game.name;

        const meta = document.createElement('p');
        meta.className = 'featured-meta';

        if (typeof game.rating === 'number' && game.rating > 0) {
            const rating = document.createElement('span');
            const star = document.createElement('span');
            star.className = 'rating-symbol';
            star.textContent = '✳';
            rating.append(star, game.rating.toFixed(1));
            meta.appendChild(rating);
        }

        if (game.released) {
            const year = document.createElement('span');
            year.textContent = game.released.slice(0, 4);
            meta.appendChild(year);
        }

        const link = document.createElement('a');
        link.className = 'featured-btn';
        link.href = `./details.html?id=${encodeURIComponent(String(game.id))}`;
        const arrow = document.createElement('span');
        arrow.textContent = '→';
        arrow.setAttribute('aria-hidden', 'true');
        link.append('View game', arrow);

        content.append(eyebrow, title, meta, link);
        slide.append(img, shade, content);
        slides.push(slide);

        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'thumb';
        thumb.setAttribute('aria-label', `Show ${game.name}`);

        const progress = document.createElement('span');
        progress.className = 'thumb-progress';
        progress.addEventListener('animationend', () => goTo(current + 1));

        const thumbImg = document.createElement('img');
        thumbImg.className = 'thumb-image';
        thumbImg.alt = '';
        thumbImg.loading = 'lazy';
        setSizedImage(thumbImg, image, 420);

        const name = document.createElement('span');
        name.className = 'thumb-name';
        name.textContent = game.name;

        thumb.append(progress, thumbImg, name);
        thumb.addEventListener('click', () => goTo(i));
        thumbs.push(thumb);
    });

    slidesBox.replaceChildren(...slides);
    thumbsBox.replaceChildren(...thumbs);
    root.classList.remove('is-loading');
    goTo(0);

    prevBtn?.addEventListener('click', () => goTo(current - 1));
    nextBtn?.addEventListener('click', () => goTo(current + 1));

    let userPaused = false;
    let hovering = false;
    let focusing = false;

    const updatePause = (): void => {
        root.classList.toggle('is-paused', userPaused || hovering || focusing || document.hidden);
        slidesBox.setAttribute('aria-live', autoplay && !userPaused ? 'off' : 'polite');
    };

    toggleBtn?.addEventListener('click', () => {
        userPaused = !userPaused;
        toggleBtn.classList.toggle('is-paused', userPaused);
        toggleBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
        updatePause();
    });

    root.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') {
            hovering = true;
            updatePause();
        }
    });
    root.addEventListener('pointerleave', () => {
        hovering = false;
        updatePause();
    });
    root.addEventListener('focusin', (e) => {
        focusing = (e.target as HTMLElement).matches(':focus-visible');
        updatePause();
    });
    root.addEventListener('focusout', () => {
        focusing = false;
        updatePause();
    });
    document.addEventListener('visibilitychange', updatePause);
    updatePause();

    root.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
    });

    let startX = 0;
    slidesBox.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
    });
    slidesBox.addEventListener('pointerup', (e) => {
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 50) goTo(dx < 0 ? current + 1 : current - 1);
    });
}