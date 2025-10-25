import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environment/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  code: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}


export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  plan: string;
}

export interface AuthResponse {
  tipo: string;
  expiraEn: number;
  usuario: Usuario;
  token: string;
}

// Interface para el usuario en el estado local
export interface CurrentUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  plan: string;
  token: string;
  googleId?: string; //NUEVO
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }


  private loadUserFromStorage(): void {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser);
        // Verificar que el token no haya expirado
        if (this.isTokenValid(savedToken)) {
          user.token = savedToken;
          this.currentUserSubject.next(user);
        } else {
          this.clearStorage();
        }
      } catch (e) {
        console.error('Error al parsear usuario guardado:', e);
        this.clearStorage();
      }
    }
  }
login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        
        const userData: CurrentUser = {
          ...response.usuario,
          token: response.token
        };
        
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        this.currentUserSubject.next(userData);
      })
    );
  }
 loginWithGoogle(code: string): Observable<AuthResponse> {
    const request: GoogleLoginRequest = { code };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/google`, request).pipe(
      tap(response => {
        const userData: CurrentUser = {
          ...response.usuario,
          token: response.token
        };
        
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        this.currentUserSubject.next(userData);
      })
    );
  }

  private clearStorage(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  getUserRole(): string {
    return this.currentUserSubject.value?.rol || 'usuario';
  }
   getUserPlan(): string {
    return this.currentUserSubject.value?.plan || 'FREE';
  }


  getCurrentUser(): CurrentUser | null {
  return this.currentUserSubject.value;
}

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!this.currentUserSubject.value && !!token && this.isTokenValid(token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getAuthHeaders(): { [header: string]: string } {
    const token = this.getToken();
    if (token && this.isTokenValid(token)) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return { 'Content-Type': 'application/json' };
  }




isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}

logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  this.currentUserSubject.next(null);
  this.router.navigate(['/home']);
}





  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/registro`, userData).pipe(
      tap(response => {
        const userData: CurrentUser = {
          ...response.usuario,
          token: response.token
        };
        
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        this.currentUserSubject.next(userData);
      })
    );
  }

 debugToken(): void {
    const token = this.getToken();
    if (token) {
      console.log('Token completo:', token);
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Payload del token:', payload);
        console.log('Expiración:', new Date(payload.exp * 1000));
        console.log('Ahora:', new Date());
        console.log('Token válido:', Date.now() < payload.exp * 1000);
      } catch (error) {
        console.error('Error decodificando token:', error);
      }
    }
  }


  
}