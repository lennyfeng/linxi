import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewTransaction?: () => void;
  onSearch?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
}

export function useGlobalShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isCtrl && e.key === 'n') {
        e.preventDefault();
        handlers.onNewTransaction?.();
      } else if (isCtrl && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
      } else if (isCtrl && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
      } else if (e.key === 'Escape' && !isInput) {
        handlers.onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
