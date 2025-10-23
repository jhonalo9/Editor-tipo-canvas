import { Injectable } from '@angular/core';
import { HttpClient,  HttpParams} from '@angular/common/http';
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


export interface CambioContrasena {
  contrasenaActual: string;
  nuevaContrasena: string;
}

export interface PermisosResponse {
  tienePermisos: boolean;
}

export interface EstadisticasUsuarios {
  totalUsuarios: number;
  usuariosPremium: number;
  usuariosFree: number;
  usuariosAdmin: number;
  usuariosRegistradosEsteMes: number;
  [key: string]: any;
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



  // ===== MÉTODOS SOLO PARA ADMIN =====

  // Obtener todos los usuarios (admin only)
  obtenerTodosUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // Obtener usuario por ID (admin only)
  obtenerUsuarioPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  // Actualizar plan de usuario (admin only)
  actualizarPlanUsuario(id: number, plan: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}/plan`, { plan });
  }

  // Actualizar rol de usuario (admin only)
  actualizarRolUsuario(id: number, rol: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}/rol`, { rol });
  }

   // Eliminar usuario (admin o propio usuario)
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

    // Buscar usuarios por nombre (admin only)
  buscarUsuariosPorNombre(nombre: string): Observable<Usuario[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params });
  }

  // Obtener estadísticas de usuarios (admin only)
  obtenerEstadisticas(): Observable<EstadisticasUsuarios> {
    return this.http.get<EstadisticasUsuarios>(`${this.apiUrl}/estadisticas`);
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