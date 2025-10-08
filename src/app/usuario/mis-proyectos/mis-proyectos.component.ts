import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "../../components/header/header.component";
import { ProyectoData, ProyectoResponseDTO, ProyectoService } from '../../core/services/proyecto.service';
import { AuthService } from '../../core/services/auth.service';
import { ArchivoService } from '../../core/services/archivo.service';
import { lastValueFrom } from 'rxjs';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mis-proyectos',
  imports: [CommonModule, HeaderComponent, RouterModule],
  templateUrl: './mis-proyectos.component.html',
  styleUrl: './mis-proyectos.component.css'
})
export class MisProyectosComponent implements OnInit {

  proyectos: ProyectoResponseDTO[] = [];
  cargando: boolean = false;
  error: string = '';

  constructor(
    private proyectoService: ProyectoService,
    private authService: AuthService,
    private archivoService: ArchivoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
  }

  async cargarProyectos(): Promise<void> {
    try {
      this.cargando = true;
      this.error = '';
      
      const proyectos = await lastValueFrom(
        this.proyectoService.getProyectosByUsuario()
      );
      
      this.proyectos = proyectos || [];
      console.log('📂 Proyectos cargados:', this.proyectos.length);
      
    } catch (error) {
      console.error('❌ Error cargando proyectos:', error);
      this.error = 'Error al cargar los proyectos';
      this.proyectos = [];
    } finally {
      this.cargando = false;
    }
  }

  /**
   * Obtiene la URL de la portada del proyecto desde el servidor
   */
  getPortadaProyecto(proyecto: ProyectoResponseDTO): string {
    try {
      const data: ProyectoData = this.proyectoService.parsearData(proyecto.data);
      
      // Si el proyecto tiene una portada guardada, construir la URL real
      if (data.metadata?.portadaUrl) {
        return this.construirUrlPortadaReal(proyecto, data.metadata.portadaUrl);
      }
      
      // Si no tiene portada, usar un placeholder SVG
      return this.getPlaceholderSVG(proyecto);
      
    } catch (error) {
      console.warn('⚠️ Error obteniendo portada, usando placeholder:', error);
      return this.getPlaceholderSVG(proyecto);
    }
  }

  /**
   * Construye la URL real de la portada desde la URL relativa guardada
   */
  private construirUrlPortadaReal(proyecto: ProyectoResponseDTO, portadaUrl: string): string {
    try {
      // Si ya es una URL completa, usarla directamente
      if (portadaUrl.startsWith('http')) {
        return portadaUrl;
      }

      // Si es una URL relativa del servidor, extraer los parámetros
      if (portadaUrl.startsWith('/archivos/')) {
        const partes = portadaUrl.split('/');
        const tipoUsuario = partes[2];
        const usuarioId = parseInt(partes[3]);
        const proyectoId = parseInt(partes[4]);
        const tipo = partes[5];
        const nombreArchivo = partes[6];

        // Usar el ArchivoService para construir la URL completa
        return this.archivoService.obtenerUrlArchivo(
          tipoUsuario as any,
          usuarioId,
          proyectoId,
          tipo as any,
          nombreArchivo,
          false
        );
      }

      // Si es una data URL (base64), usarla directamente
      if (portadaUrl.startsWith('data:')) {
        return portadaUrl;
      }

      // Si no reconocemos el formato, usar placeholder
      console.warn('⚠️ Formato de portada no reconocido:', portadaUrl);
      return this.getPlaceholderSVG(proyecto);

    } catch (error) {
      console.error('❌ Error construyendo URL de portada:', error);
      return this.getPlaceholderSVG(proyecto);
    }
  }

  /**
   * Genera un placeholder SVG personalizado para el proyecto
   */
  private getPlaceholderSVG(proyecto: ProyectoResponseDTO): string {
    const data = this.proyectoService.parsearData(proyecto.data);
    const totalEventos = data.eventos?.length || 0;
    const titulo = proyecto.titulo || 'Proyecto sin título';
    
    // Color basado en el hash del título para consistencia
    const color = this.getColorFromString(titulo);
    
    // SVG placeholder personalizado
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="350" height="200" viewBox="0 0 350 200">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#gradient)"/>
      <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">${this.escapeHtml(titulo)}</text>
      <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)">${totalEventos} eventos</text>
      <text x="50%" y="75%" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.6)">Línea de Tiempo</text>
    </svg>`;
  }

  /**
   * Genera colores consistentes basados en el string
   */
  private getColorFromString(str: string): { primary: string, secondary: string } {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      { primary: '#667eea', secondary: '#764ba2' },
      { primary: '#f093fb', secondary: '#f5576c' },
      { primary: '#4facfe', secondary: '#00f2fe' },
      { primary: '#43e97b', secondary: '#38f9d7' },
      { primary: '#fa709a', secondary: '#fee140' },
      { primary: '#a8edea', secondary: '#fed6e3' },
      { primary: '#d299c2', secondary: '#fef9d7' },
      { primary: '#89f7fe', secondary: '#66a6ff' }
    ];
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Escapa HTML para el SVG
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Maneja errores de carga de imágenes
   */
  onImageError(event: any, proyecto: ProyectoResponseDTO): void {
    console.warn('⚠️ Error cargando portada del proyecto:', proyecto.titulo);
    
    // Reemplazar con placeholder SVG
    event.target.src = this.getPlaceholderSVG(proyecto);
  }

  /**
   * Obtiene información del proyecto para mostrar en la tarjeta
   */
  getInfoProyecto(proyecto: ProyectoResponseDTO): any {
    try {
      const data = this.proyectoService.parsearData(proyecto.data);
      return {
        totalEventos: data.eventos?.length || 0,
        rangoAnios: this.getRangoAnios(data.eventos || []),
        elementos: data.elementosKonva?.length || 0,
        ultimaModificacion: proyecto.fechaModificacion,
        tienePortada: !!data.metadata?.portadaUrl
      };
    } catch {
      return {
        totalEventos: 0,
        rangoAnios: 'N/A',
        elementos: 0,
        ultimaModificacion: proyecto.fechaModificacion,
        tienePortada: false
      };
    }
  }

  private getRangoAnios(eventos: any[]): string {
    if (eventos.length === 0) return 'Sin eventos';
    
    const anios = eventos.map(e => e.year).filter(anio => anio);
    if (anios.length === 0) return 'Sin años';
    
    const min = Math.min(...anios);
    const max = Math.max(...anios);
    
    return min === max ? `${min}` : `${min} - ${max}`;
  }

  async abrirProyecto(proyecto: ProyectoResponseDTO): Promise<void> {
    try {
      console.log('🔄 Abriendo proyecto:', proyecto.id);
      this.navegarAEditor(proyecto.id!);
    } catch (error) {
      console.error('❌ Error abriendo proyecto:', error);
      alert('Error al abrir el proyecto');
    }
  }

  async eliminarProyecto(proyecto: ProyectoResponseDTO, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el proyecto "${proyecto.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await lastValueFrom(
        this.proyectoService.deleteProyecto(proyecto.id!)
      );
      
      console.log('✅ Proyecto eliminado:', proyecto.id);
      this.mostrarMensaje(`Proyecto "${proyecto.titulo}" eliminado correctamente`);
      this.cargarProyectos();
      
    } catch (error) {
      console.error('❌ Error eliminando proyecto:', error);
      alert('Error al eliminar el proyecto');
    }
  }

  async cargarMisProyectos(): Promise<void> {
  try {
    this.cargando = true; // ya tienes esta propiedad definida como 'cargando'
    
    const proyectos = await lastValueFrom(
      this.proyectoService.getProyectosByUsuario()
    );
    
    this.proyectos = proyectos || [];
    console.log('📂 Proyectos cargados:', this.proyectos.length);
    
  } catch (error) {
    console.error('❌ Error cargando proyectos:', error);
    this.error = 'Error al cargar los proyectos';
    alert('Error al cargar los proyectos');
  } finally {
    this.cargando = false;
  }
}


  private navegarAEditor(proyectoId: number): void {
   
    this.router.navigate(['/editor'], { queryParams: { proyecto: proyectoId } });
  }

  private mostrarMensaje(mensaje: string): void {
    // Puedes usar un sistema de notificaciones más elegante
    alert(`✅ ${mensaje}`);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}