import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LearningPathPlanItem, LearningPathScheduleItem } from '../../models/learning-path.model';

@Component({
  selector: 'app-learning-path',
  templateUrl: './learning-path.component.html',
  styleUrls: ['./learning-path.component.css']
})
export class LearningPathComponent implements OnInit {
  loading = true;
  error: string | null = null;
  categories: string[] = [];
  plan: LearningPathPlanItem[] = [];
  schedule: LearningPathScheduleItem[] = [];
  insights: string[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadLearningPath();
  }

  reload(): void {
    this.loadLearningPath();
  }

  private loadLearningPath(): void {
    this.loading = true;
    this.error = null;
    this.api.getLearningPath().subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          this.error = 'Failed to load learning path';
          this.loading = false;
          return;
        }
        this.categories = res?.categories ?? [];
        this.plan = res?.plan ?? [];
        this.schedule = res?.schedule ?? [];
        this.insights = res?.insights ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load learning path';
        this.loading = false;
      }
    });
  }
}
