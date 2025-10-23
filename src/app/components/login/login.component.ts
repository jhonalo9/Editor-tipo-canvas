import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
   
    FormsModule ,CommonModule,ReactiveFormsModule, RouterModule
  ],
})
export class LoginComponent implements OnInit {

 credentials: LoginRequest = {
    email: '',
    password: ''
  };

  loginForm: FormGroup;
  mensaje: string = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {}

  onLogin(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.mensaje = '';
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('Respuesta login:', res);
        
        // ✅ CORREGIDO: Acceder al rol a través de usuario.rol
        if (res.usuario.rol === 'ADMIN') { // ← Cambiado de 'admin' a 'ADMIN' (mayúsculas)
          this.router.navigate(['/admin/home']);
        } else {
          this.router.navigate(['/plantillas']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error en login', err);
        
        // Manejo mejorado de errores
        if (err.status === 401) {
          this.errorMessage = 'Credenciales inválidas';
        } else if (err.status === 0) {
          this.errorMessage = 'Error de conexión con el servidor';
        } else {
          this.errorMessage = err.error?.message || 'Error en el login';
        }
      }
    });
  }

  // Métodos de conveniencia para acceder a los controles del formulario
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}







