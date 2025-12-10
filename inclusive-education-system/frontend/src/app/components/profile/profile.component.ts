import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { ProfileService, UserProfile } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  isEditMode = false;
  profile: UserProfile = {};
  confidenceSubject: string = '';
  confidenceValue: number = 50;
  // Local bindings to avoid two-way binding with optional chaining
  profilePrefStyle: string | '' = '';
  profilePrefPace: string | '' = '';

  constructor(private authService: AuthService, private profileService: ProfileService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    // Load extended profile info
    this.profileService.getMe().subscribe({
      next: (data) => {
        if (data?.profile) {
          this.profile = data.profile;
          try {
            // If preferences came as string, attempt parse
            if (this.profile && typeof (this.profile as any).preferences === 'string') {
              (this.profile as any).preferences = JSON.parse((this.profile as any).preferences as any);
            }
          } catch {}
          // Ensure preferences object exists
          (this.profile as any).preferences = (this.profile as any).preferences || {};
          // Initialize local select bindings
          this.profilePrefStyle = (this.profile as any).preferences?.style || '';
          this.profilePrefPace = (this.profile as any).preferences?.pace || '';
        }
      },
      error: () => {}
    });
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

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  saveProfile(event: Event): void {
    event.preventDefault();
    // TODO: Implement save profile logic
    // Map local fields back to preferences before save
    (this.profile as any).preferences = {
      ...((this.profile as any).preferences || {}),
      ...(this.profilePrefStyle !== '' ? { style: this.profilePrefStyle } : {}),
      ...(this.profilePrefPace !== '' ? { pace: this.profilePrefPace } : {})
    };

    this.profileService.updateMe(this.profile).subscribe({
      next: () => {
        this.isEditMode = false;
      },
      error: () => {
        this.isEditMode = false;
      }
    });
  }

  submitConfidence(event: Event): void {
    event.preventDefault();
    if (!this.confidenceSubject) return;
    const value = Math.max(0, Math.min(100, Number(this.confidenceValue)));
    this.profileService.setSubjectConfidence({ subject: this.confidenceSubject, confidence: value }).subscribe({
      next: () => {
        this.confidenceSubject = '';
        this.confidenceValue = 50;
      },
      error: () => {}
    });
  }
}
