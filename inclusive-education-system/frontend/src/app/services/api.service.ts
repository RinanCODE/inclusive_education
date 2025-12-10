import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LearningPathResponse } from '../models/learning-path.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Student endpoints
  getStudentDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/dashboard`);
  }

  getRecommendations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/recommendations`);
  }

  getPerformance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/performance`);
  }

  submitPerformance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/students/performance`, data);
  }

  enrollCourse(courseId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/students/enroll`, { courseId });
  }

  getAvailableCourses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/courses`);
  }

  getCourseModules(courseId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/courses/${courseId}/modules`);
  }

  // Messages endpoints
  getMessages(conversationWith?: number): Observable<any> {
    let params = new HttpParams();
    if (conversationWith) {
      params = params.set('conversationWith', conversationWith.toString());
    }
    return this.http.get(`${this.apiUrl}/messages`, { params });
  }

  getConversations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/conversations`);
  }

  sendMessage(receiverId: number, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/messages`, { receiverId, content });
  }

  markMessagesAsRead(senderId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/read`, { senderId });
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/unread-count`);
  }

  // Study groups endpoints
  getStudyGroups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/study-groups`);
  }

  getMyStudyGroups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/study-groups/my-groups`);
  }

  getStudyGroupDetails(groupId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/study-groups/${groupId}`);
  }

  createStudyGroup(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/study-groups`, data);
  }

  joinStudyGroup(groupId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/study-groups/${groupId}/join`, {});
  }

  leaveStudyGroup(groupId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/study-groups/${groupId}/leave`, {});
  }

  // AI endpoints
  chatWithAI(message: string, context?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/chatbot`, { message, context });
  }

  getChatHistory(limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/ai/chatbot/history`, {
      params: { limit: limit.toString() }
    });
  }

  archiveChatHistory(): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/chatbot/archive`, {});
  }

  getArchivedChatHistory(limit: number = 100): Observable<any> {
    return this.http.get(`${this.apiUrl}/ai/chatbot/archive`, {
      params: { limit: limit.toString() }
    });
  }

  getLearningPath(): Observable<LearningPathResponse> {
    return this.http.get<LearningPathResponse>(`${this.apiUrl}/ai/learning-path`);
  }

  getFullRecommendations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ai/full-recommendations`);
  }

  summarizeText(text: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/summarize`, { text });
  }

  summarizeFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.apiUrl}/ai/summarize`, formData);
  }

  // Mentor endpoints
  getMentorDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mentor/dashboard`);
  }

  getPeerMatches(): Observable<any> {
    return this.http.get(`${this.apiUrl}/match/peers`);
  }

  // Admin endpoints
  getAllUsers(role?: string, search?: string): Observable<any> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    if (search) params = params.set('search', search);
    return this.http.get(`${this.apiUrl}/admin/users`, { params });
  }

  getUserById(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/${userId}`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users`, data);
  }

  updateUser(userId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}`, data);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`);
  }

  getAllCourses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/courses`);
  }

  createCourse(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/courses`, data);
  }

  updateCourse(courseId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/courses/${courseId}`, data);
  }

  deleteCourse(courseId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/courses/${courseId}`);
  }

  assignMentor(mentorId: number, studentId: number, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/mentor-assignments`, {
      mentorId,
      studentId,
      notes
    });
  }

  getMentorAssignments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/mentor-assignments`);
  }

  getAdminStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/stats`);
  }
}
