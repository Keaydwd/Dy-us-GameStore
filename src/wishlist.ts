export interface SavedGame {
    id: number;
    name: string;
    image: string | null;
    rating: number | null;
    released: string | null;
    genre: string | null;
    savedAt: number;
}

const STORAGE_KEY = 'dyeus:wishlist:v1';

type Listener = (list: SavedGame[]) => void;
const listeners = new Set<Listener>();

function isSavedGame(value: unknown): value is SavedGame {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return typeof v.id === 'number' && typeof v.name === 'string' && typeof v.savedAt === 'number';
}

function read(): SavedGame[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isSavedGame) : [];
    } catch {
        return [];
    }
}

let cache: SavedGame[] = read();

function commit(next: SavedGame[]): void {
    cache = next;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Unable to save the archive:', error);
    }
    listeners.forEach((listener) => listener(cache));
}

export const wishlist = {
    all: (): SavedGame[] => cache,

    has: (id: number): boolean => cache.some((game) => game.id === id),

    add(game: SavedGame): void {
        if (wishlist.has(game.id)) return;
        commit([game, ...cache]);
    },

    remove(id: number): SavedGame | undefined {
        const removed = cache.find((game) => game.id === id);
        if (removed) commit(cache.filter((game) => game.id !== id));
        return removed;
    },

    restore(list: SavedGame[]): void {
        commit(list);
    },

    clear(): SavedGame[] {
        const backup = cache;
        commit([]);
        return backup;
    },

    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};

window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
        cache = read();
        listeners.forEach((listener) => listener(cache));
    }
});