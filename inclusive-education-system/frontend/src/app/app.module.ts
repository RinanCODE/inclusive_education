import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Services
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { AccessibilityService } from './services/accessibility.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Components
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { StudentDashboardComponent } from './components/student/student-dashboard/student-dashboard.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LearningPathComponent } from './components/learning-path/learning-path.component';
import { MessagesComponent } from './components/messages/messages.component';
import { StudyGroupsComponent } from './components/study-groups/study-groups.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminCoursesComponent } from './components/admin/admin-courses/admin-courses.component';
import { PeerMentorDashboardComponent } from './components/dashboard/peer-mentor-dashboard/peer-mentor-dashboard.component';
import { StudentMentorshipComponent } from './components/student/student-mentorship/student-mentorship.component';
import { PeerMentorOpportunitiesComponent } from './components/dashboard/peer-mentor-opportunities/peer-mentor-opportunities.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { SidebarComponent } from './components/shared/sidebar/sidebar.component';
import { AccessibilityToolbarComponent } from './components/shared/accessibility-toolbar/accessibility-toolbar.component';
import { CoursesComponent } from './components/student/courses/courses.component';
import { CourseModulesComponent } from './components/student/course-modules/course-modules.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    StudentDashboardComponent,
    ChatbotComponent,
    LearningPathComponent,
    MessagesComponent,
    StudyGroupsComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminCoursesComponent,
    PeerMentorDashboardComponent,
    StudentMentorshipComponent,
    PeerMentorOpportunitiesComponent,
    NavbarComponent,
    SidebarComponent,
    AccessibilityToolbarComponent,
    ProfileComponent,
    CoursesComponent,
    CourseModulesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsComponent
  ],
  providers: [
    AuthService,
    ApiService,
    AccessibilityService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
