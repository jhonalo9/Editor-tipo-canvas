import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environment/environment';
import { AuthService, CurrentUser } from './auth.service';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  plan: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Upgrade del usuario actual a premium
  upgradeAPremium(): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/upgrade-premium`, {}).pipe(
      tap(usuarioActualizado => {
        // Actualizar el usuario en el AuthService
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const updatedUser: CurrentUser = {
            ...currentUser,
            plan: usuarioActualizado.plan
          };
          // Actualizar en localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // Emitir el nuevo valor
          (this.authService as any).currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  // Downgrade de un usuario a free (solo admin)
  downgradeAFree(usuarioId: number): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${usuarioId}/downgrade-free`, {});
  }

  // Obtener perfil del usuario actual
  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/perfil`);
  }

  // Actualizar perfil
  actualizarPerfil(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/perfil`, usuario).pipe(
      tap(usuarioActualizado => {
        // Actualizar el usuario en el AuthService
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const updatedUser: CurrentUser = {
            ...currentUser,
            ...usuarioActualizado
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          (this.authService as any).currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  // Verificar si el usuario actual es premium
  esPremium(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.plan === 'PREMIUM';
  }

  // Verificar si el usuario actual es admin
  esAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.rol === 'ADMIN';
  }
}