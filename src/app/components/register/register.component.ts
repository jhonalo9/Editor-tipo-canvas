import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../../core/services/auth.service';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
   
    FormsModule  // 👈 Agregar aquí
  ],
})
export class RegisterComponent {
  userData: RegisterRequest = {
    nombre: '',
    email: '',
    password: ''
  };
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.userData.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.userData).subscribe({
      next: () => {
        this.isLoading = false;
        // Después de registrarse, iniciar sesión automáticamente
        this.authService.login({
          email: this.userData.email,
          password: this.userData.password
        }).subscribe(() => {
          this.router.navigate(['/editor']);
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error || 'Error al registrar usuario';
      }
    });
  }

  registerWithGoogle(): void {
    // Implementar lógica de Google OAuth aquí
    console.log('Registrarse con Google');
  }
}