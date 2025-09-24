import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, lastValueFrom } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  
  constructor(private http: HttpClient) {}

  // === MÉTODOS PARA PORTADAS DE PROYECTOS (USUARIOS) ===

  subirPortadaProyecto(archivo: File, usuarioId: number, proyectoId: number): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    return this.http.post<string>(
      `${environment.apiUrl}/archivos/users/${usuarioId}/projects/${proyectoId}/portada`,
      formData,
      { responseType: 'text' as 'json' }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error subiendo portada:', error);
        return throwError(() => new Error('Error al subir la portada'));
      })
    );
  }

  obtenerPortadaProyecto(usuarioId: number, proyectoId: number): Observable<{portada: string}> {
    return this.http.get<{portada: string}>(
      `${environment.apiUrl}/archivos/users/${usuarioId}/projects/${proyectoId}/portada`
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error obteniendo portada:', error);
        return throwError(() => new Error('Error al obtener la portada'));
      })
    );
  }

  // === MÉTODOS PARA RECURSOS/ASSETS ===

  subirRecursoProyecto(archivo: File, usuarioId: number, proyectoId: number): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    return this.http.post<string>(
      `${environment.apiUrl}/archivos/users/${usuarioId}/projects/${proyectoId}/assets`,
      formData,
      { responseType: 'text' as 'json' }
    );
  }

  // === MÉTODO GENERAL PARA OBTENER ARCHIVOS ===

  obtenerUrlImagenCompleta(rutaRelativa: string): string {
    if (rutaRelativa.startsWith('data:') || rutaRelativa.startsWith('http')) {
      return rutaRelativa;
    }
    return `${environment.apiUrl}/archivos/obtener${rutaRelativa}`;
  }

  // === MÉTODO PARA SUBIR CUALQUIER ARCHIVO ===
  subirArchivo(archivo: File, endpoint: string): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    return this.http.post<string>(
      `${environment.apiUrl}${endpoint}`,
      formData,
      { responseType: 'text' as 'json' }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error subiendo archivo:', error);
        return throwError(() => new Error('Error al subir el archivo'));
      })
    );
  }
}