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


   private obtenerUrlPorDefecto(): string {
    return '/assets/images/placeholder-portada.png';
  }


   getDefaultImageUrl(): string {
    return this.obtenerUrlPorDefecto();
  }


   obtenerPortadaProyecto(usuarioId: number, proyectoId: number): Observable<{portada: string}> {
    return this.http.get<{portada: string}>(
      `${environment.apiUrl}/archivos/users/${usuarioId}/projects/${proyectoId}/portada`
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si es 404, no es un error grave - simplemente no hay portada
        if (error.status === 404) {
          return throwError(() => new Error('PORTADA_NO_ENCONTRADA'));
        }
        console.error('Error obteniendo portada:', error);
        return throwError(() => new Error('Error al obtener la portada'));
      })
    );
  }

   obtenerImagenPortadaDirecta(tipo: string, ownerId: number, recursoId: number): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/archivos/portada/${tipo}/${ownerId}/${recursoId}`,
      { responseType: 'blob' }
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

   // Método mejorado para obtener URL completa
  obtenerUrlImagenCompleta(rutaRelativa: string): string {
    // Si ya es una URL completa, retornarla
    if (rutaRelativa.startsWith('http')) {
        return rutaRelativa;
    }
    
    // Si es una ruta relativa del sistema de archivos, construir URL del endpoint
    if (rutaRelativa.startsWith('/uploads/')) {
        // Extraer los parámetros de la ruta
        const partes = rutaRelativa.split('/');
        // /uploads/users/6/projects/16/portada_1758742876406.png
        // partes[2] = users, partes[3] = 6, partes[5] = 16
        
        if (partes.length >= 6 && partes[2] === 'users') {
            const usuarioId = partes[3];
            const proyectoId = partes[5];
            return `${environment.apiUrl}/archivos/portada/user/${usuarioId}/${proyectoId}`;
        }
    }
    
    // Para otros casos, usar el endpoint de obtener
    return `${environment.apiUrl}/archivos/obtener${rutaRelativa}`;
}

  

  // Método para verificar si una imagen existe
  verificarImagenExiste(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
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