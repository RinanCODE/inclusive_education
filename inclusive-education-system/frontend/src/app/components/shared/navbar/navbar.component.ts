import { Component, OnInit, HostListener } from '@angular/core';
import { AuthService, User } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  showUserMenu = false;
  showNotifications = false;
  unreadCount = 3;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.user-menu') || target.closest('.nav-icon-btn');
    
    if (!clickedInside) {
      this.showUserMenu = false;
      this.showNotifications = false;
    }
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.currentUser.name.substring(0, 2).toUpperCase();
  }

  getRoleDisplay(): string {
    if (!this.currentUser?.role) return '';
    
    const roleMap: { [key: string]: string } = {
      'student': 'Student',
      'peer_mentor': 'Peer Mentor',
      'admin': 'Administrator'
    };
    
    return roleMap[this.currentUser.role] || this.currentUser.role;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
    }
  }

  closeMenu(): void {
    this.showUserMenu = false;
    this.showNotifications = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
