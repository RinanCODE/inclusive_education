import { Component, OnInit } from '@angular/core';
import { AccessibilityService } from './services/accessibility.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Inclusive Education System';

  constructor(private accessibilityService: AccessibilityService) {}

  ngOnInit(): void {
    // Initialize accessibility settings from localStorage
    this.accessibilityService.loadSettings();
  }
}
