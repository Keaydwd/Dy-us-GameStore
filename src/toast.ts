interface ToastAction {
    label: string;
    onClick: () => void;
}

let region: HTMLDivElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function dismiss(toast: HTMLElement): void {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 350);
}

export function showToast(message: string, action?: ToastAction): void {
    if (!region) {
        region = document.createElement('div');
        region.className = 'toast-region';
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        document.body.appendChild(region);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';

    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = message;
    toast.appendChild(text);

    if (action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'toast-action';
        button.textContent = action.label;
        button.addEventListener('click', () => {
            action.onClick();
            dismiss(toast);
        });
        toast.appendChild(button);
    }

    region.replaceChildren(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    clearTimeout(timer);
    timer = setTimeout(() => dismiss(toast), 5000);
}