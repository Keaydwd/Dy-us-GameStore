import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadApi() {
    vi.stubEnv('VITE_RAWG_API_KEY', 'test-key');
    vi.resetModules();
    return import('./shared');
}

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('api()', () => {
    it('builds the URL with the key and params and returns JSON', async () => {
        const fetchMock = vi.mocked(fetch);
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) } as Response);

        const { api } = await loadApi();
        const data = await api<{ results: unknown[] }>('/games', { page: '2' });

        const url = String(fetchMock.mock.calls[0]?.[0]);
        expect(url).toContain('https://api.rawg.io/api/games?');
        expect(url).toContain('key=test-key');
        expect(url).toContain('page=2');
        expect(data.results).toEqual([]);
    });

    it('throws ApiError with the HTTP status on a failed response', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);

        const { api, ApiError } = await loadApi();
        const error = await api('/games/1').catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).status).toBe(404);
    });

    it('throws when the API key is missing', async () => {
        vi.stubEnv('VITE_RAWG_API_KEY', '');
        vi.resetModules();
        const { api } = await import('./shared');

        await expect(api('/games')).rejects.toThrow('Missing API key');
    });
});
