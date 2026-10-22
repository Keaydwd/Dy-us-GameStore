import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedGame } from './wishlist';

const KEY = 'dyeus:wishlist:v1';

const make = (id: number, extra: Partial<SavedGame> = {}): SavedGame => ({
    id,
    name: `Game ${id}`,
    image: null,
    rating: 4,
    released: '2020-01-01',
    genre: 'Action',
    savedAt: id,
    ...extra,
});

// Модуль тримає стан у змінній, тому для кожного тесту імпортуємо його наново
async function load() {
    vi.resetModules();
    return (await import('./wishlist')).wishlist;
}

beforeEach(() => localStorage.clear());

describe('wishlist', () => {
    it('adds a game and puts the newest first', async () => {
        const wishlist = await load();
        wishlist.add(make(1));
        wishlist.add(make(2));

        expect(wishlist.all().map((g) => g.id)).toEqual([2, 1]);
        expect(wishlist.has(1)).toBe(true);
    });

    it('does not add the same game twice', async () => {
        const wishlist = await load();
        wishlist.add(make(1));
        wishlist.add(make(1));

        expect(wishlist.all()).toHaveLength(1);
    });

    it('removes a game and returns it', async () => {
        const wishlist = await load();
        wishlist.add(make(1));

        expect(wishlist.remove(1)?.name).toBe('Game 1');
        expect(wishlist.has(1)).toBe(false);
    });

    it('returns undefined when removing an unknown game', async () => {
        const wishlist = await load();
        expect(wishlist.remove(999)).toBeUndefined();
    });

    it('clears the archive and can restore it (Undo)', async () => {
        const wishlist = await load();
        wishlist.add(make(1));
        wishlist.add(make(2));

        const backup = wishlist.clear();
        expect(wishlist.all()).toHaveLength(0);

        wishlist.restore(backup);
        expect(wishlist.all()).toHaveLength(2);
    });

    it('persists changes to localStorage', async () => {
        const wishlist = await load();
        wishlist.add(make(1));

        const stored = JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedGame[];
        expect(stored).toHaveLength(1);
        expect(stored[0]?.id).toBe(1);
    });

    it('loads previously saved games', async () => {
        localStorage.setItem(KEY, JSON.stringify([make(7)]));
        const wishlist = await load();

        expect(wishlist.has(7)).toBe(true);
    });

    it('returns an empty list when localStorage contains broken JSON', async () => {
        localStorage.setItem(KEY, '{not valid json');
        const wishlist = await load();

        expect(wishlist.all()).toEqual([]);
    });

    it('ignores invalid entries in storage', async () => {
        localStorage.setItem(KEY, JSON.stringify([make(1), { id: 'x' }, null, 42]));
        const wishlist = await load();

        expect(wishlist.all()).toHaveLength(1);
    });

    it('notifies subscribers and stops after unsubscribe', async () => {
        const wishlist = await load();
        const listener = vi.fn();
        const unsubscribe = wishlist.subscribe(listener);

        wishlist.add(make(1));
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();
        wishlist.add(make(2));
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('syncs when another tab changes the storage', async () => {
        const wishlist = await load();
        const listener = vi.fn();
        wishlist.subscribe(listener);

        localStorage.setItem(KEY, JSON.stringify([make(5)]));
        window.dispatchEvent(new StorageEvent('storage', { key: KEY }));

        expect(wishlist.has(5)).toBe(true);
        expect(listener).toHaveBeenCalled();
    });
});
