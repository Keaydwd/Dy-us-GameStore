import { beforeEach, describe, expect, it } from 'vitest';
import {
    createGameCard,
    createSaveButton,
    formatCount,
    htmlToText,
    setSizedImage,
    toSavedGame,
    type Game,
} from './shared';
import { wishlist } from './wishlist';

const ORIGINAL = 'https://media.rawg.io/media/games/abc/def.jpg';

const game: Game = {
    id: 7,
    name: 'Hades',
    background_image: null,
    rating: null,
    released: '2020-09-17',
    genres: [{ id: 1, name: 'Action', slug: 'action' }],
};

describe('formatCount', () => {
    it('adds thousands separators', () => {
        expect(formatCount(1234567)).toBe('1,234,567');
    });
});

describe('htmlToText', () => {
    it('turns paragraphs and line breaks into plain text', () => {
        expect(htmlToText('<p>Hello</p><p>World</p>')).toBe('Hello\n\nWorld');
        expect(htmlToText('A<br>B')).toBe('A\nB');
    });

    it('strips tags and never keeps script content', () => {
        const result = htmlToText('<p>Safe</p><script>alert(1)</script><b>bold</b>');

        expect(result).toContain('Safe');
        expect(result).toContain('bold');
        expect(result).not.toContain('alert');
        expect(result).not.toContain('<');
    });
});

describe('setSizedImage', () => {
    it('requests a resized copy of RAWG images', () => {
        const img = document.createElement('img');
        setSizedImage(img, ORIGINAL, 640);

        expect(img.src).toBe('https://media.rawg.io/media/resize/640/-/games/abc/def.jpg');
    });

    it('leaves other URLs untouched', () => {
        const img = document.createElement('img');
        const url = 'https://example.com/pic.png';
        setSizedImage(img, url, 640);

        expect(img.src).toBe(url);
    });

    it('falls back to the original, then marks the image unavailable', () => {
        const img = document.createElement('img');
        setSizedImage(img, ORIGINAL, 640);

        img.dispatchEvent(new Event('error'));
        expect(img.src).toBe(ORIGINAL);

        img.dispatchEvent(new Event('error'));
        expect(img.classList.contains('image-unavailable')).toBe(true);
    });
});

describe('toSavedGame', () => {
    it('keeps a light snapshot of the game', () => {
        const saved = toSavedGame(game);

        expect(saved).toMatchObject({ id: 7, name: 'Hades', genre: 'Action', image: null });
        expect(typeof saved.savedAt).toBe('number');
    });

    it('uses null when the game has no genres', () => {
        expect(toSavedGame({ ...game, genres: undefined }).genre).toBeNull();
    });
});

describe('createGameCard', () => {
    it('links to the details page and renders fallbacks', () => {
        const card = createGameCard(game);

        expect(card.querySelector('a.game-card')?.getAttribute('href')).toBe('./details.html?id=7');
        expect(card.querySelector('.game-title')?.textContent).toBe('Hades');
        expect(card.querySelector('.game-rating')?.textContent).toBe('Not rated');
        expect(card.querySelector('.save-btn')).not.toBeNull();
    });
});

describe('createSaveButton', () => {
    beforeEach(() => {
        wishlist.clear();
        document.body.replaceChildren();
    });

    it('toggles the game in the archive and keeps aria-pressed in sync', () => {
        const button = createSaveButton(game);
        document.body.append(button);

        expect(button.getAttribute('aria-pressed')).toBe('false');

        button.click();
        expect(wishlist.has(7)).toBe(true);
        expect(button.getAttribute('aria-pressed')).toBe('true');

        button.click();
        expect(wishlist.has(7)).toBe(false);
        expect(button.getAttribute('aria-pressed')).toBe('false');
    });
});
