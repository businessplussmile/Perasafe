
import { useEffect } from 'react';
import { UserProfile, SecureDocument } from '../types';
import { logSecurityAlert, AlertType } from '../services/securityService';

export const useSecurity = (
  enabled: boolean, 
  doc: SecureDocument | null,
  readerProfile: UserProfile | null,
  onSecurityTrigger?: (active: boolean) => void,
  onFatal?: () => void
) => {
  useEffect(() => {
    if (!enabled || !doc || !readerProfile || readerProfile.uid === doc.uploaderId) return;

    const triggerPanic = (type: AlertType, fatal: boolean = false) => {
      if (onSecurityTrigger) onSecurityTrigger(true);
      logSecurityAlert(type, doc, readerProfile);
      
      // Force instant CSS blur for zero-latency protection
      addCssBlur();

      if (fatal && onFatal) {
        onFatal();
      }
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
        triggerPanic('SCREENSHOT_ATTEMPT', true);
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

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        triggerPanic('BLUR_LOSS');
      }
    };

    const handleFocus = () => {
      releasePanic();
    };

    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    const threshold = 160;

    const handleResize = () => {
      const widthDiff = Math.abs(window.innerWidth - lastWidth);
      const heightDiff = Math.abs(window.innerHeight - lastHeight);
      
      // Detection of sudden DevTools panel snapping
      if (widthDiff > 120 || heightDiff > 120) {
        triggerPanic('BLUR_LOSS', true); // Kill on brutal resize
      }

      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        triggerPanic('BLUR_LOSS', true);
      }

      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerPanic('CLIPBOARD_COPY');
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      // If user uses more than 1 finger (usually 3 for screen grab), blur instantly
      if (e.touches.length > 1) {
        triggerPanic('SCREENSHOT_ATTEMPT');
        addCssBlur();
      }
    };

    // DevTools Detection Loop (anti-inspection)
    const securityInterval = setInterval(() => {
      const before = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const after = performance.now();
      if (after - before > 100) {
        // DevTools is open and paused execution
        triggerPanic('BLUR_LOSS', true);
      }
    }, 1500);

    // Fast pure dom css blur to block screenshot tools before React can re-render
    const addCssBlur = () => {
      const el = document.getElementById('secure-document-content');
      if (el) {
        el.style.filter = 'blur(60px)';
        el.style.opacity = '0';
      }
    };
    const removeCssBlur = () => {
      const el = document.getElementById('secure-document-content');
      if (el) {
        el.style.filter = '';
        el.style.opacity = '';
      }
    };

    window.addEventListener('blur', addCssBlur);
    window.document.addEventListener('mouseleave', addCssBlur);
    window.addEventListener('focus', removeCssBlur);
    window.document.addEventListener('mouseenter', removeCssBlur);

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCopy);
    window.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('touchstart', handleTouchStart);
    window.document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBlur); // Mobile browsers often fire pagehide on screenshot

    const handleDrag = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragstart', handleDrag);

    return () => {
      window.removeEventListener('blur', addCssBlur);
      window.document.removeEventListener('mouseleave', addCssBlur);
      window.removeEventListener('focus', removeCssBlur);
      window.document.removeEventListener('mouseenter', removeCssBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCopy);
      window.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('pagehide', handleBlur);
      window.removeEventListener('dragstart', handleDrag);
      window.document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(securityInterval);
    };
  }, [enabled, doc, readerProfile, onSecurityTrigger]);
};
