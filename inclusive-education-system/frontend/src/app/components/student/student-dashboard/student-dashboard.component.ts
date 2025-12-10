import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  currentUser: User | null = null;
  enrolledCourses = 0;
  completedCourses = 0;
  inProgressCourses = 0;
  studyGroups = 0;
  averageProgress = 0;
  recommendations: { title: string; description?: string; reason?: string }[] = [];
  recentPerformance: any[] = [];
  fullRecs: { lessons?: any[]; readings?: any[]; exercises?: any[]; schedule?: any; feedback?: string[] } = {};
  suggestedPeers: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadStudentData();
      }
    });
  }

  loadStudentData(): void {
    // Dashboard stats
    this.api.getStudentDashboard().subscribe({
      next: (data) => {
        try {
          this.enrolledCourses = data?.enrollments?.length || 0;
          const completed = (data?.recentPerformance || []).filter((p: any) => p.completion_status === 'completed').length;
          this.completedCourses = completed;
          this.inProgressCourses = Math.max(0, this.enrolledCourses - this.completedCourses);
          this.studyGroups = (data?.studyGroups || []).length || 0;
          this.averageProgress = Number(data?.stats?.averageScore) || 0;
        } catch {}
      },
      error: () => {}
    });

    // Recommendations
    this.api.getRecommendations().subscribe({
      next: (res) => {
        const recs = res?.recommendations || [];
        this.recommendations = recs.map((r: any) => ({
          title: r.title || 'Recommended Course',
          description: r.description,
          reason: r.reason
        }));
      },
      error: () => { this.recommendations = []; }
    });

    // Recent Performance list
    this.api.getPerformance().subscribe({
      next: (res) => {
        this.recentPerformance = res?.performance || [];
      },
      error: () => { this.recentPerformance = []; }
    });

    // Full recommendations bundle (lessons/readings/exercises/schedule/feedback)
    this.api.getFullRecommendations().subscribe({
      next: (res) => {
        this.fullRecs = res || {};
      },
      error: () => { this.fullRecs = {}; }
    });

    // Suggested peers
    this.api.getPeerMatches().subscribe({
      next: (res) => { this.suggestedPeers = res?.matches || []; },
      error: () => { this.suggestedPeers = []; }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  openChatWithPeer(peer: any): void {
    this.router.navigate(['/dashboard/messages'], { queryParams: { peerId: peer.id } });
  }

  openLearningPath(): void {
    this.router.navigate(['/dashboard/learning-path']);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
}
