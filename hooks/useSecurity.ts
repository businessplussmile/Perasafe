
import { useEffect } from 'react';
import { UserProfile, SecureDocument } from '../types';
import { logSecurityAlert, AlertType } from '../services/securityService';

export const useSecurity = (
  enabled: boolean, 
  doc: SecureDocument | null,
  readerProfile: UserProfile | null,
  onSecurityTrigger?: (active: boolean) => void
) => {
  useEffect(() => {
    if (!enabled || !doc || !readerProfile) return;

    const triggerPanic = (type: AlertType) => {
      if (onSecurityTrigger) onSecurityTrigger(true);
      logSecurityAlert(type, doc, readerProfile);
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
        triggerPanic('SCREENSHOT_ATTEMPT');
        return false;
      }
    };

    const handleVisibilityChange = () => {
      if (window.document.visibilityState !== 'visible') {
        triggerPanic('BLUR_LOSS');
      }
    };

    const handleBlur = () => {
      // Déclenchement instantané dès que la fenêtre perd le focus
      triggerPanic('BLUR_LOSS');
    };

    const handleFocus = () => {
      releasePanic();
    };

    const threshold = 160;
    const handleResize = () => {
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        triggerPanic('BLUR_LOSS');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerPanic('CLIPBOARD_COPY');
    };

    const handleSelectStart = (e: Event) => e.preventDefault();

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCopy);
    window.addEventListener('selectstart', handleSelectStart);
    window.document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleDrag = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragstart', handleDrag);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCopy);
      window.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('dragstart', handleDrag);
      window.document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, doc, readerProfile, onSecurityTrigger]);
};
