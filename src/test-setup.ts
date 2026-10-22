class MemoryStorage implements Storage {
    private readonly store = new Map<string, string>();

    get length(): number {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }

    getItem(key: string): string | null {
        return this.store.get(key) ?? null;
    }

    key(index: number): string | null {
        return [...this.store.keys()][index] ?? null;
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    setItem(key: string, value: string): void {
        this.store.set(key, String(value));
    }
}

const storage = new MemoryStorage();

for (const target of [globalThis, window]) {
    Object.defineProperty(target, 'localStorage', {
        value: storage,
        configurable: true,
        writable: true,
    });
}