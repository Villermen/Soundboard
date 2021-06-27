import { useEffect } from 'react';

/**
 * Triggers `callback` when the given `key` is pressed down. Can optionally be
 * disabled by setting `enabled` to `false`.
 */
export default function useKeydown(
    key: string,
    callback: () => void,
    enabled: boolean = true,
): void {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === key) {
                callback();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled]);
}
