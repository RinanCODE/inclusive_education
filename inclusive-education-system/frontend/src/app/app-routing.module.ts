import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { StudentDashboardComponent } from './components/student/student-dashboard/student-dashboard.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { MessagesComponent } from './components/messages/messages.component';
import { StudyGroupsComponent } from './components/study-groups/study-groups.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminCoursesComponent } from './components/admin/admin-courses/admin-courses.component';
import { PeerMentorDashboardComponent } from './components/dashboard/peer-mentor-dashboard/peer-mentor-dashboard.component';
import { StudentMentorshipComponent } from './components/student/student-mentorship/student-mentorship.component';
import { PeerMentorOpportunitiesComponent } from './components/dashboard/peer-mentor-opportunities/peer-mentor-opportunities.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LearningPathComponent } from './components/learning-path/learning-path.component';
import { CoursesComponent } from './components/student/courses/courses.component';
import { CourseModulesComponent } from './components/student/course-modules/course-modules.component';

import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'student',
        component: StudentDashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['student'] }
      },
      {
        path: 'peer-mentor',
        component: PeerMentorDashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['peer_mentor'] }
      },
      {
        path: 'student/mentorship',
        component: StudentMentorshipComponent,
        canActivate: [RoleGuard],
        data: { roles: ['student'] }
      },
      {
        path: 'peer-mentor/opportunities',
        component: PeerMentorOpportunitiesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['peer_mentor'] }
      },
      {
        path: 'chatbot',
        component: ChatbotComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'messages',
        component: MessagesComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'study-groups',
        component: StudyGroupsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'admin/users',
        component: AdminUsersComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'admin/courses',
        component: AdminCoursesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'learning-path',
        component: LearningPathComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'courses',
        component: CoursesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['student'] }
      },
      {
        path: 'courses/:id',
        component: CourseModulesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['student'] }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AuthGuard]
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
