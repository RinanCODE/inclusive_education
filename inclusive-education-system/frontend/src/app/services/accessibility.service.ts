import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  dyslexiaFont: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private settingsSubject = new BehaviorSubject<AccessibilitySettings>({
    fontSize: 100,
    highContrast: false,
    dyslexiaFont: false
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.settingsSubject.next(settings);
      this.applySettings(settings);
    }
  }

  saveSettings(settings: AccessibilitySettings): void {
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    this.settingsSubject.next(settings);
    this.applySettings(settings);
  }

  private applySettings(settings: AccessibilitySettings): void {
    const body = document.body;

    // Apply font size
    body.className = body.className.replace(/font-size-\d+/g, '');
    body.classList.add(`font-size-${settings.fontSize}`);

    // Apply high contrast
    if (settings.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Apply dyslexia font
    if (settings.dyslexiaFont) {
      body.classList.add('dyslexia-font');
    } else {
      body.classList.remove('dyslexia-font');
    }
  }

  increaseFontSize(): void {
    const current = this.settingsSubject.value;
    const newSize = Math.min(current.fontSize + 25, 200);
    this.saveSettings({ ...current, fontSize: newSize });
  }

  decreaseFontSize(): void {
    const current = this.settingsSubject.value;
    const newSize = Math.max(current.fontSize - 25, 100);
    this.saveSettings({ ...current, fontSize: newSize });
  }

  resetFontSize(): void {
    const current = this.settingsSubject.value;
    this.saveSettings({ ...current, fontSize: 100 });
  }

  toggleHighContrast(): void {
    const current = this.settingsSubject.value;
    this.saveSettings({ ...current, highContrast: !current.highContrast });
  }

  toggleDyslexiaFont(): void {
    const current = this.settingsSubject.value;
    this.saveSettings({ ...current, dyslexiaFont: !current.dyslexiaFont });
  }

  getCurrentSettings(): AccessibilitySettings {
    return this.settingsSubject.value;
  }

  // Keyboard navigation helper
  setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Escape key to close modals/dialogs
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      }

      // Ctrl/Cmd + Plus to increase font size
      if ((event.ctrlKey || event.metaKey) && event.key === '+') {
        event.preventDefault();
        this.increaseFontSize();
      }

      // Ctrl/Cmd + Minus to decrease font size
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        this.decreaseFontSize();
      }

      // Ctrl/Cmd + 0 to reset font size
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        this.resetFontSize();
      }
    });
  }

  // Announce to screen readers
  announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}
