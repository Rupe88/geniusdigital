'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export default function ContentProtection() {
    const { user } = useAuth();

    useEffect(() => {
        // Admins can inspect freely; apply protection only for non-admins
        if (user?.role === 'ADMIN') {
            return;
        }
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

        // Disable F12, Ctrl/Cmd+Shift+I, Ctrl/Cmd+Shift+J, Ctrl/Cmd+U (view source)
        const handleKeyDown = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey; // Ctrl (Win/Linux) or Cmd (Mac)

            // Disable F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl/Cmd+Shift+I (DevTools)
            if (mod && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl/Cmd+Shift+J (Console)
            if (mod && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl/Cmd+U (View Source)
            if (mod && e.key === 'u') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl/Cmd+S (Save Page)
            if (mod && e.key === 's') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl/Cmd+A (Select All) - but allow in input fields
            if (mod && e.key === 'a') {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return; // Allow select all in input fields
                }
                e.preventDefault();
                return false;
            }

            // Disable Ctrl/Cmd+P (Print)
            if (mod && e.key === 'p') {
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
    }, [user?.role]);

    return null;
}
