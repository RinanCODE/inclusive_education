import { Component } from '@angular/core';

interface Opportunity {
  title: string;
  description: string;
  subject: string;
  action: string;
  type: 'apply' | 'offer';
}

@Component({
  selector: 'app-peer-mentor-opportunities',
  templateUrl: './peer-mentor-opportunities.component.html',
  styleUrls: ['./peer-mentor-opportunities.component.css']
})
export class PeerMentorOpportunitiesComponent {
  opportunities: Opportunity[] = [
    {
      title: 'Apply for Mentoring Support',
      description: 'Need help facilitating sessions or want guidance from a senior mentor? Submit your availability and goals.',
      subject: 'General mentoring',
      action: 'Request a Mentor',
      type: 'apply'
    },
    {
      title: 'Lead a Peer Mentoring Session',
      description: 'Share your expertise in a subject you love. Choose the focus area and let students opt in.',
      subject: 'Choose a subject specialization',
      action: 'Offer to Mentor',
      type: 'offer'
    }
  ];

  subjects = ['Mathematics', 'Science', 'Programming', 'Languages', 'Wellness & Study Skills'];
  selectedSubject = this.subjects[0];

  submit(opportunity: Opportunity): void {
    const action = opportunity.type === 'apply' ? 'request' : 'offer';
    alert(`Thanks! Your ${action} for ${this.selectedSubject} has been submitted.`);
  }
}

