import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders  } from '@angular/common/http';
import { Observable, tap  } from 'rxjs';
import { environment } from '../../environment/environment';


export interface FavoritoResponseDTO {
  id: number;
  plantillaId: number;
  usuarioId: number;
  fechaAgregado: string;
  // Agrega más propiedades según tu DTO real
}

export interface FavoritoInfo {
  esFavorita: boolean;
  totalFavoritos: number;
}

export interface ToggleFavoritoResponse {
  message: string;
  esFavorito: boolean;
}

export interface EstadisticasFavoritos {
  // Define las propiedades según lo que retorne tu backend
  totalFavoritos?: number;
  usuariosActivos?: number;
  plantillasPopulares?: any[];
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritoService {
  private apiUrl = `${environment.apiUrl}/favoritos`;

  constructor(private http: HttpClient) { }

   
private favoritosCache = new Map<number, boolean>();
 

 toggleFavorito(plantillaId: number): Observable<ToggleFavoritoResponse> {
    return this.http.post<ToggleFavoritoResponse>(`${this.apiUrl}/toggle`, { plantillaId })
      .pipe(
        tap(response => {
          // Actualizar cache local
          this.favoritosCache.set(plantillaId, response.esFavorito);
        })
      );
  }

  /**
   * Verificar si una plantilla es favorita
   */
  verificarFavorito(plantillaId: number): Observable<FavoritoInfo> {
    return this.http.get<FavoritoInfo>(`${this.apiUrl}/plantilla/${plantillaId}`)
      .pipe(
        tap(response => {
          // Actualizar cache local
          this.favoritosCache.set(plantillaId, response.esFavorita);
        })
      );
  }

  /**
   * Obtener estado de favorito desde cache (para UI inmediata)
   */
  getFavoritoFromCache(plantillaId: number): boolean {
    return this.favoritosCache.get(plantillaId) || false;
  }

  /**
   * Obtener todos los favoritos del usuario
   */
  obtenerFavoritos(): Observable<FavoritoResponseDTO[]> {
    return this.http.get<FavoritoResponseDTO[]>(this.apiUrl);
  }

  /**
   * Eliminar favorito específico
   */
  eliminarFavorito(plantillaId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/plantilla/${plantillaId}`)
      .pipe(
        tap(() => {
          // Actualizar cache local
          this.favoritosCache.set(plantillaId, false);
        })
      );
  }

  /**
   * Obtener contador de favoritos del usuario
   */
  obtenerContadorFavoritos(): Observable<{ totalFavoritos: number }> {
    return this.http.get<{ totalFavoritos: number }>(`${this.apiUrl}/contador`);
  }

  /**
   * Precargar estados de favoritos para múltiples plantillas
   */
  precargarEstadosFavoritos(plantillaIds: number[]): void {
    plantillaIds.forEach(plantillaId => {
      this.verificarFavorito(plantillaId).subscribe();
    });
  }

  // GET /api/favoritos/con-info - Obtener favoritos con información completa
  obtenerFavoritosConInfo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/con-info`);
  }

  // GET /api/favoritos/recientes - Obtener favoritos recientes
  obtenerFavoritosRecientes(): Observable<FavoritoResponseDTO[]> {
    return this.http.get<FavoritoResponseDTO[]>(`${this.apiUrl}/recientes`);
  }

 

  

  // GET /api/favoritos/buscar - Buscar en favoritos
  buscarFavoritos(query: string): Observable<FavoritoResponseDTO[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<FavoritoResponseDTO[]>(`${this.apiUrl}/buscar`, { params });
  }

  // DELETE /api/favoritos/limpiar - Limpiar todos los favoritos del usuario
  limpiarFavoritos(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/limpiar`);
  }

  // GET /api/favoritos/{id} - Obtener favorito específico
  obtenerFavorito(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ===== MÉTODOS SOLO PARA ADMIN =====

  // GET /api/favoritos/admin/estadisticas - Estadísticas de favoritos
  obtenerEstadisticasFavoritos(): Observable<EstadisticasFavoritos> {
    return this.http.get<EstadisticasFavoritos>(`${this.apiUrl}/admin/estadisticas`);
  }

  // GET /api/favoritos/admin/populares - Plantillas más populares (global)
  obtenerPlantillasPopulares(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/populares`);
  }
}