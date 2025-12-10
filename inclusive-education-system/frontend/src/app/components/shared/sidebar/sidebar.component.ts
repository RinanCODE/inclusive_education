import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  currentUser: User | null = null;
  isCollapsed = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    // Check if sidebar should be collapsed on mobile
    this.checkMobileView();
    window.addEventListener('resize', () => this.checkMobileView());
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  private checkMobileView(): void {
    if (window.innerWidth < 768) {
      this.isCollapsed = true;
    }
  }
}
