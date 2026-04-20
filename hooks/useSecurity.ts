
import { useEffect } from 'react';

export const useSecurity = (enabled: boolean, onSecurityTrigger?: (active: boolean) => void) => {
  useEffect(() => {
    if (!enabled) return;

    const triggerPanic = () => {
      if (onSecurityTrigger) onSecurityTrigger(true);
    };

    const releasePanic = () => {
      if (onSecurityTrigger) onSecurityTrigger(false);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const forbiddenKeys = ['F12', 'PrintScreen', 'Snapshot'];
      const forbiddenCombos = [
        (e.ctrlKey && e.shiftKey && e.key === 'I'),
        (e.ctrlKey && e.shiftKey && e.key === 'C'),
        (e.ctrlKey && e.shiftKey && e.key === 'J'),
        (e.ctrlKey && e.key === 'u'),
        (e.ctrlKey && e.key === 's'),
        (e.ctrlKey && e.key === 'p'),
        (e.metaKey && e.shiftKey && e.key === '4'),
        (e.metaKey && e.shiftKey && e.key === '3'),
        (e.metaKey && e.shiftKey && e.key === '5'),
      ];

      if (forbiddenKeys.includes(e.key) || forbiddenCombos.some(combo => combo)) {
        e.preventDefault();
        triggerPanic();
        return false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        triggerPanic();
      }
    };

    const handleBlur = () => {
      // Déclenchement instantané dès que la fenêtre perd le focus
      triggerPanic();
    };

    const handleFocus = () => {
      // Optionnel : on peut choisir de ne pas libérer automatiquement pour plus de sécurité
      // mais pour l'expérience utilisateur, on libère au focus
      releasePanic();
    };

    const threshold = 160;
    const handleResize = () => {
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        triggerPanic();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleDrag = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragstart', handleDrag);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('dragstart', handleDrag);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, onSecurityTrigger]);
};
