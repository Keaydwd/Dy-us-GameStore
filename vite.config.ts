/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                details: resolve(__dirname, 'details.html'),
                developers: resolve(__dirname, 'developers.html'),
                developer: resolve(__dirname, 'developer.html'),
                favorites: resolve(__dirname, 'favorites.html'),
            },
        },
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
    },
});
