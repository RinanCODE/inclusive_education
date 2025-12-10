import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      // Check if route has role restrictions
      const allowedRoles = route.data['roles'] as Array<string>;
      
      if (allowedRoles && allowedRoles.includes(currentUser.role)) {
        return true;
      }
    }

    // Role not authorized, redirect to appropriate dashboard
    if (currentUser) {
      if (currentUser.role === 'student') {
        this.router.navigate(['/dashboard/student']);
      } else if (currentUser.role === 'admin') {
        this.router.navigate(['/dashboard/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/login']);
    }
    
    return false;
  }
}
