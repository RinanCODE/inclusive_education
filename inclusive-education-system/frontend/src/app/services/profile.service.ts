import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  academic_background?: string;
  learning_goals?: string;
  accessibility_needs?: string;
  preferences?: any;
}

export interface SubjectConfidence {
  subject: string;
  confidence: number; // 0-100
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/me`);
  }

  updateMe(profile: UserProfile): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/me`, profile);
  }

  setSubjectConfidence(payload: SubjectConfidence): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/confidence`, payload);
  }

  logBehavior(event_type: string, metadata?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/behavior`, { event_type, metadata });
  }
}
