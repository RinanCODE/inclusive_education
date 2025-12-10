import { Component } from '@angular/core';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  fontSize = 100;

  constructor(private accessibilityService: AccessibilityService) {}

  toggleHighContrast(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.accessibilityService.toggleHighContrast();
  }

  toggleDyslexiaFont(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.accessibilityService.toggleDyslexiaFont();
  }

  increaseFontSize(): void {
    if (this.fontSize < 200) {
      this.fontSize += 25;
      this.accessibilityService.increaseFontSize();
    }
  }

  decreaseFontSize(): void {
    if (this.fontSize > 100) {
      this.fontSize -= 25;
      this.accessibilityService.decreaseFontSize();
    }
  }
}
