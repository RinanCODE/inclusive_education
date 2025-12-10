import { Component } from '@angular/core';

@Component({
  selector: 'app-student-mentorship',
  templateUrl: './student-mentorship.component.html',
  styleUrls: ['./student-mentorship.component.css']
})
export class StudentMentorshipComponent {
  mentorshipOption = {
    title: 'Get a Mentor',
    description: 'Connect with experienced peers or mentors who can guide you through long-term goals, accountability, and study plans.',
    cta: 'Apply for a Mentor',
    icon: 'target'
  };

  interests: string[] = [
    'Mathematics',
    'Science',
    'Languages',
    'Technology',
    'Arts & Humanities',
    'Exam Preparation'
  ];

  selectedInterest = this.interests[0];

  startApplication(): void {
    alert(`Your mentorship request has been submitted! We will match you with someone who focuses on ${this.selectedInterest}.`);
  }
}

