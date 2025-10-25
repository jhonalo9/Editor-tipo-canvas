import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class DesignGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    const role = this.authService.getUserRole();
    const plan = this.authService.getUserPlan();

    if (isLoggedIn && (role === 'ADMIN' || isLoggedIn && plan === 'PREMIUN')) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
