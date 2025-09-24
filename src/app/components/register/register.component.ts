import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest } from '../../core/services/auth.service';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
   CommonModule,RouterModule,
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
    // Validaciones
    if (!this.userData.nombre || !this.userData.email || !this.userData.password) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (this.userData.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.userData.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Auto-login después del registro exitoso
        const loginCredentials: LoginRequest = {
          email: this.userData.email,
          password: this.userData.password
        };
        
        this.authService.login(loginCredentials).subscribe({
          next: (loginResponse) => {
            // Redirigir según el rol
            if (loginResponse.rol === 'admin') {
              this.router.navigate(['/admin/plantillas']);
            } else {
              this.router.navigate(['/usuario/descripcion-proyect']);
            }
          },
          error: (loginError) => {
            console.error('Error en login automático:', loginError);
            // Si falla el login, redirigir al login manual
            this.router.navigate(['/login']);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error en registro:', error);
        
        // Manejar diferentes tipos de errores
        if (error.status === 400) {
          this.errorMessage = 'Datos inválidos. Verifica la información.';
        } else if (error.status === 409) {
          this.errorMessage = 'El correo electrónico ya está registrado.';
        } else if (error.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu internet.';
        } else {
          this.errorMessage = error.error?.message || 'Error al registrar usuario';
        }
      }
    });
  }

  registerWithGoogle(): void {
    // Implementar lógica de Google OAuth aquí
    console.log('Registrarse con Google');
  }
}