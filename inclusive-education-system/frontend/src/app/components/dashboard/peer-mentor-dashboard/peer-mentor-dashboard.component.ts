import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-peer-mentor-dashboard',
  templateUrl: './peer-mentor-dashboard.component.html',
  styleUrls: ['./peer-mentor-dashboard.component.css']
})
export class PeerMentorDashboardComponent implements OnInit {
  currentUser: User | null = null;
  activeStudents = 0;
  totalSessions = 0;
  studyGroupsManaged = 0;
  averageRating = 0;
  pendingRequests = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadMentorData();
      }
    });
  }

  loadMentorData(): void {
    this.api.getMentorDashboard().subscribe({
      next: (data) => {
        this.activeStudents = Number(data?.activeStudents) || 0;
        this.studyGroupsManaged = Number(data?.studyGroupsManaged) || 0;
        // totalMessages used as placeholder for totalSessions for now
        this.totalSessions = Number(data?.totalMessages) || 0;
        // averageRating and pendingRequests placeholders until ratings/requests schema exists
        this.averageRating = 4.8;
        this.pendingRequests = 0;
      },
      error: () => {}
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
}
