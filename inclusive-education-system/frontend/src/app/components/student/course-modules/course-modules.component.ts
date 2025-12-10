import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-course-modules',
  templateUrl: './course-modules.component.html',
  styleUrls: ['./course-modules.component.css']
})
export class CourseModulesComponent implements OnInit {
  courseId!: number;
  loading = false;
  error = '';
  success = '';
  course: any = null;
  modules: any[] = [];
  progress = 0;
  submitting: Record<number, boolean> = {};

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      this.courseId = Number(pm.get('id'));
      if (!this.courseId || isNaN(this.courseId)) {
        this.error = 'Invalid course id in route.';
        return;
      }
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getCourseModules(this.courseId).subscribe({
      next: (res) => {
        this.course = res?.course || null;
        this.modules = res?.modules || [];
        this.progress = res?.progress || 0;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.error || 'Failed to load modules';
        this.loading = false;
      }
    });
  }

  completeModule(moduleId: number): void {
    if (this.submitting[moduleId]) return;
    this.submitting[moduleId] = true;
    this.error = '';
    this.success = '';
    const payload = {
      moduleId: moduleId,
      score: null,
      completionStatus: 'completed',
      timeSpentMinutes: null,
      notes: null
    };
    this.api.submitPerformance(payload).subscribe({
      next: () => {
        this.success = 'Module marked as completed';
        // update local state
        this.modules = this.modules.map(m => m.id === moduleId ? { ...m, completed: 1 } : m);
        const total = this.modules.length || 0;
        const done = this.modules.filter(m => m.completed === 1).length;
        this.progress = total > 0 ? Number(((done / total) * 100).toFixed(2)) : 0;
        this.submitting[moduleId] = false;
      },
      error: (e) => {
        this.error = e?.error?.error || 'Failed to update module status';
        this.submitting[moduleId] = false;
      }
    });
  }

  retry(): void { this.load(); }
}
