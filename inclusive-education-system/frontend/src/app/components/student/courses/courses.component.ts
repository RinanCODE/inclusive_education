import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-student-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  loading = false;
  enrollingId: number | null = null;
  courses: any[] = [];
  error = '';
  success = '';
  query = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading = true;
    this.api.getAvailableCourses().subscribe({
      next: (res) => {
        this.courses = res?.courses || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load courses';
        this.loading = false;
      }
    });
  }

  enroll(courseId: number): void {
    if (this.enrollingId) return;
    this.enrollingId = courseId;
    this.error = '';
    this.success = '';
    this.api.enrollCourse(courseId).subscribe({
      next: () => {
        this.success = 'Enrolled successfully';
        this.enrollingId = null;
        // Mark in-memory state
        this.courses = this.courses.map(c => c.id === courseId ? { ...c, enrolled_by_me: 1 } : c);
      },
      error: (e) => {
        this.error = e?.error?.error || 'Failed to enroll';
        this.enrollingId = null;
      }
    });
  }

  refresh(): void {
    this.error = '';
    this.success = '';
    this.loadCourses();
  }

  trackByCourse(_idx: number, item: any) { return item.id; }

  get filteredCourses(): any[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.courses;
    return this.courses.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q)
    );
  }
}
