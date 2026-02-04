'use client';

import { useEffect } from 'react';

export default function ContentProtection() {
    useEffect(() => {
        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // Disable text selection (but allow in input fields and textareas)
        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return true; // Allow selection in input fields
            }
            e.preventDefault();
            return false;
        };

        // Disable copy, cut, paste (but allow in input fields and textareas)
        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return true; // Allow copy in input fields
            }
            e.preventDefault();
            return false;
        };

        const handleCut = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return true; // Allow cut in input fields
            }
            e.preventDefault();
            return false;
        };

        const handlePaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return true; // Allow paste in input fields
            }
            e.preventDefault();
            return false;
        };

        // Disable drag and drop
        const handleDragStart = (e: DragEvent) => {
            e.preventDefault();
            return false;
        };

        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (view source)
        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+S (Save Page)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+A (Select All) - but allow in input fields
            if (e.ctrlKey && e.key === 'a') {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return true; // Allow select all in input fields
                }
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+P (Print)
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                return false;
            }
        };

        // Add event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('dragstart', handleDragStart);
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup on unmount
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('dragstart', handleDragStart);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return null;
}
