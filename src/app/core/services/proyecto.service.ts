import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, lastValueFrom } from 'rxjs';
import { environment } from '../../environment/environment';
import { FileService } from './file.service';
import { CaptureService } from './capture.service';

export interface Proyecto {
  idProyecto?: number;
  titulo: string;
  descripcion: string;
  data: any;
  usuario: any;
  plantillaBase?: any;
  fechaCreacion?: Date;
  fechaModificacion?: Date;
  portadaUrl?: string;
}

export interface ProyectoRequest {
  titulo: string;
  descripcion: string;
  data: any;
  idPlantillaBase?: number;
  portadaUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private apiUrl = `${environment.apiUrl}/proyectos`;
  private proyectoTemporal = new BehaviorSubject<{titulo: string, descripcion: string} | null>(null);

  constructor(
    private http: HttpClient,
    private fileService: FileService,
    private captureService: CaptureService
  ) { }

  // === MÉTODOS CON CAPTURA AUTOMÁTICA DE PORTADA ===

  async createProyectoWithCapture(
    proyectoRequest: ProyectoRequest, 
    editorElement: HTMLElement,
    usuarioId: number
  ): Promise<Proyecto> {
    try {
      console.log('🔄 Creando proyecto con captura automática...');

      // 1. Primero crear el proyecto para obtener ID
      const proyecto = await lastValueFrom(
        this.createProyecto(proyectoRequest)
      );

      if (!proyecto.idProyecto) {
        throw new Error('No se pudo obtener ID del proyecto');
      }

      // 2. Capturar imagen del editor y subir como portada
      const portadaUrl = await this.capturarYSubirPortada(
        editorElement, 
        usuarioId, 
        proyecto.idProyecto
      );

      // 3. Actualizar proyecto con URL de portada
      proyectoRequest.portadaUrl = portadaUrl;
      const proyectoActualizado = await lastValueFrom(
        this.updateProyecto(proyecto.idProyecto, proyectoRequest)
      );

      console.log('✅ Proyecto creado con portada:', portadaUrl);
      return proyectoActualizado;

    } catch (error) {
      console.error('❌ Error creando proyecto con captura:', error);
      throw error;
    }
  }

  async updateProyectoWithCapture(
    id: number, 
    proyectoRequest: ProyectoRequest, 
    editorElement: HTMLElement,
    usuarioId: number
  ): Promise<Proyecto> {
    try {
      console.log('🔄 Actualizando proyecto con nueva captura...');

      // 1. Capturar nueva imagen y subir como portada
      const portadaUrl = await this.capturarYSubirPortada(
        editorElement, 
        usuarioId, 
        id
      );

      // 2. Actualizar proyecto con nueva URL de portada
      proyectoRequest.portadaUrl = portadaUrl;
      const proyectoActualizado = await lastValueFrom(
        this.updateProyecto(id, proyectoRequest)
      );

      console.log('✅ Proyecto actualizado con nueva portada:', portadaUrl);
      return proyectoActualizado;

    } catch (error) {
      console.error('❌ Error actualizando proyecto con captura:', error);
      throw error;
    }
  }

  private async capturarYSubirPortada(
    editorElement: HTMLElement, 
    usuarioId: number, 
    proyectoId: number
  ): Promise<string> {
    try {
      // 1. Capturar el editor como imagen
      console.log('📸 Capturando editor...');
      const imagenBlob = await this.captureService.captureEditor(editorElement);
      
      // 2. Convertir a File
      const imagenFile = this.captureService.blobToFile(
        imagenBlob, 
        `portada_${proyectoId}_${Date.now()}.png`
      );

      // 3. Subir al servidor
      console.log('⬆️ Subiendo portada al servidor...');
      const portadaUrl = await lastValueFrom(
        this.fileService.subirPortadaProyecto(imagenFile, usuarioId, proyectoId)
      );

      return portadaUrl;

    } catch (error) {
      console.error('❌ Error en captura/subida de portada:', error);
      throw new Error('No se pudo generar la portada automática');
    }
  }

  // === MÉTODOS EXISTENTES (modificados para incluir portada) ===

  setProyectoTemporal(metadatos: { titulo: string, descripcion: string }): void {
    this.proyectoTemporal.next(metadatos);
  }

  getProyectoTemporal(): { titulo: string, descripcion: string } | null {
    return this.proyectoTemporal.value;
  }

  clearProyectoTemporal(): void {
    this.proyectoTemporal.next(null);
  }

  getProyectosByUsuario(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.apiUrl);
  }

  getProyectoById(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${id}`);
  }

  createProyecto(proyecto: ProyectoRequest): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.apiUrl, proyecto);
  }

  updateProyecto(id: number, proyecto: ProyectoRequest): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.apiUrl}/${id}`, proyecto);
  }

  deleteProyecto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // === MÉTODO PARA OBTENER PORTADA ===
  getPortadaProyecto(usuarioId: number, proyectoId: number): Observable<{portada: string}> {
    return this.fileService.obtenerPortadaProyecto(usuarioId, proyectoId);
  }
}