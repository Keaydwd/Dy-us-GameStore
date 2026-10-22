import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showToast } from './toast';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('showToast', () => {
    it('shows the message', () => {
        showToast('Saved “Hades”');

        expect(document.querySelector('.toast-text')?.textContent).toBe('Saved “Hades”');
    });

    it('shows only one toast at a time', () => {
        showToast('First');
        showToast('Second');

        expect(document.querySelectorAll('.toast')).toHaveLength(1);
        expect(document.querySelector('.toast-text')?.textContent).toBe('Second');
    });

    it('runs the action and closes the toast when the button is clicked', () => {
        const onClick = vi.fn();
        showToast('Removed', { label: 'Undo', onClick });

        document.querySelector<HTMLButtonElement>('.toast-action')?.click();
        vi.advanceTimersByTime(400);

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.toast')).toBeNull();
    });

    it('disappears automatically after a few seconds', () => {
        showToast('Hello');
        vi.advanceTimersByTime(6000);

        expect(document.querySelector('.toast')).toBeNull();
    });
});
