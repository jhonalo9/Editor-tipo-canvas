import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Categoria {
  idCategoria?: number;
  nombre: string;
  descripcion?: string;
  estado?: string;
  plantillas?: any[]; // Ajusta según tu modelo de Plantilla
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) { }

  // Obtener todas las categorías
  obtenerTodas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl);
  }

  // Obtener categoría por ID
  obtenerPorId(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`);
  }

  // Crear nueva categoría
  crear(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.apiUrl}/guardar`, categoria);
  }

  // Actualizar categoría
  actualizar(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, categoria);
  }

  // Eliminar categoría
   eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      responseType: 'text' 
    });
  }

  // Buscar categorías por nombre
  buscar(query: string): Observable<Categoria[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Categoria[]>(`${this.apiUrl}/buscar`, { params });
  }

  // Obtener categorías con plantillas públicas
  obtenerPublicas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/publicas`);
  }

  // Obtener estadísticas
  obtenerEstadisticas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/estadisticas`);
  }

  // Verificar si categoría existe y está activa
  verificarExistencia(id: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${id}/existe`);
  }
}