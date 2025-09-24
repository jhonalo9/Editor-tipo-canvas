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
   
    FormsModule ,CommonModule,ReactiveFormsModule, RouterModule// 👈 Agregar aquí
  ],
})
export class LoginComponent implements OnInit {

  credentials: LoginRequest = {
    email: '',
    password: ''
  };

  loginForm: FormGroup;   // 👈 aquí declaras la propiedad
  mensaje: string = '';

  
  isLoading = false;
  errorMessage = '';



  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // inicializas el formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {}

  


onLogin(): void {
  if (this.loginForm.invalid) return;

  this.authService.login(this.loginForm.value).subscribe({
    next: (res) => {
      console.log('Respuesta login:', res); // para debug
      if (res.rol === 'admin') {
        this.router.navigate(['/admin/plantillas']);   // admin
      } else {
        this.router.navigate(['/']);               // usuario normal
      }
    },
    error: (err) => {
      console.error('Error en login', err);
      this.mensaje = 'Credenciales inválidas';
    }
  });
}





}




