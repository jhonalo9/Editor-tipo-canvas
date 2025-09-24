import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { EditorAdminComponent } from '../../components/admin/editor-admin/editor-admin.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Plantilla, PlantillaRequest, PlantillaService } from '../../core/services/plantilla.service';
import { AuthResponse, AuthService } from '../../core/services/auth.service';
import { Proyecto, ProyectoRequest, ProyectoService } from '../../core/services/proyecto.service';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { CaptureService } from '../../core/services/capture.service';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-editor-usuario',
  imports: [ReactiveFormsModule, EditorAdminComponent,CommonModule ],
  templateUrl: './editor-usuario.component.html',
  styleUrl: './editor-usuario.component.css'
})
export class EditorUsuarioComponent implements OnInit{
  proyectoForm: FormGroup;
  tituloProyecto: string = '';
  descripcionProyecto: string = '';
  mensaje: string = '';
  isLoggedIn = false;
  proyectos: Proyecto[] = [];
  plantillas: Plantilla[] = [];
  proyectoSeleccionado: Proyecto | null = null;
  showTemplatesModal = false;
  showProjectsModal = false;
  proyectoId: number | undefined = undefined;
  currentUser: AuthResponse | null = null;
  previsualizacionPortada: string | null = null;
 
  
  @ViewChild('editor') editorComponent!: EditorAdminComponent;
   @ViewChild('editorContainer') editorContainer!: ElementRef;

 constructor(
    private fb: FormBuilder,
    private proyectoService: ProyectoService,
    private plantillaService: PlantillaService,
    private authService: AuthService,
    private captureService: CaptureService
  ) {
    this.proyectoForm = this.fb.group({
      titulo: ['', [Validators.required]],
      descripcion: ['']
    });
  }

ngOnInit(): void {
    console.log('🔐 Iniciando componente editor-usuario');
    
    this.authService.currentUser$.subscribe({
      next: (user) => {
        console.log('👤 Estado de usuario:', user);
        this.isLoggedIn = !!user;
        this.currentUser = user;
        
        if (this.isLoggedIn) {
          console.log('✅ Usuario autenticado, cargando proyectos...');
          this.cargarProyectosUsuario();
          this.cargarPlantillasDisponibles();
        } else {
          console.log('❌ Usuario NO autenticado');
        }
      },
      error: (err) => {
        console.error('💥 Error en suscripción auth:', err);
      }
    });
  }

  // Cargar proyectos del usuario
  cargarProyectosUsuario(): void {
    console.log('📦 Intentando cargar proyectos...');
    
    this.proyectoService.getProyectosByUsuario().subscribe({
      next: (proyectos) => {
        console.log('✅ Proyectos cargados exitosamente:', proyectos);
        this.proyectos = proyectos;
        
        // Cargar portadas para cada proyecto
        this.cargarPortadasProyectos();
      },
      error: (err) => {
        console.error('❌ Error detallado al cargar proyectos:', err);
        this.mensaje = 'Error al cargar tus proyectos: ' + err.status;
      }
    });
  }

  private cargarPortadasProyectos(): void {
    if (!this.currentUser?.idUsuario) return;

    this.proyectos.forEach(proyecto => {
      if (proyecto.idProyecto) {
        this.proyectoService.getPortadaProyecto(this.currentUser!.idUsuario, proyecto.idProyecto).subscribe({
          next: (response) => {
            if (response.portada) {
              proyecto.portadaUrl = response.portada;
            }
          },
          error: (err) => {
            console.log('Proyecto sin portada:', proyecto.titulo);
            proyecto.portadaUrl = undefined; // Asegurar que sea undefined
          }
        });
      }
    });
  }

  // Cargar plantillas disponibles
  cargarPlantillasDisponibles(): void {
    this.plantillaService.getPlantillasPublicas().subscribe({
      next: (plantillas) => {
        console.log('Plantillas disponibles:', plantillas);
        this.plantillas = plantillas;
      },
      error: (err) => {
        console.error('Error al cargar plantillas', err);
      }
    });
  }


  obtenerUrlPortada(rutaRelativa: string | undefined): string {
    if (!rutaRelativa) {
      return '/assets/images/placeholder-portada.png'; // Imagen por defecto
    }
    
    if (rutaRelativa.startsWith('http') || rutaRelativa.startsWith('data:')) {
      return rutaRelativa;
    }
    
    return `${environment.apiUrl}/archivos/obtener${rutaRelativa}`;
  }

  verPortadaCompleta(rutaPortada: string | undefined): void {
    if (!rutaPortada) {
      this.mensaje = 'No hay portada disponible para este proyecto';
      return;
    }
    
    const urlCompleta = this.obtenerUrlPortada(rutaPortada);
    window.open(urlCompleta, '_blank');
  }

  // Método para previsualizar portada (modificado)
  

  // Modal de plantillas
  openTemplatesModal(): void {
    this.showTemplatesModal = true;
  }

  closeTemplatesModal(): void {
    this.showTemplatesModal = false;
  }

  // Modal de proyectos guardados
  openProjectsModal(): void {
    this.showProjectsModal = true;
  }

  closeProjectsModal(): void {
    this.showProjectsModal = false;
  }

  // Usar plantilla para nuevo proyecto
  usarPlantilla(plantilla: Plantilla): void {
    this.proyectoSeleccionado = null;
    this.proyectoForm.reset();
    
    if (this.editorComponent) {
      this.editorComponent.loadPlantilla(plantilla.data);
      this.mensaje = `Plantilla "${plantilla.nombre}" cargada - ¡Personalízala y guárdala como proyecto!`;
    }
    
    this.closeTemplatesModal();
  }

  // Cargar proyecto existente
   cargarProyecto(proyecto: Proyecto): void {
    this.proyectoSeleccionado = proyecto;
    
    // ✅ Usar type assertion para manejar number | undefined
    this.proyectoId = proyecto.idProyecto as number | undefined;
    
    // ✅ Pasar el proyectoId al editor (puede ser undefined)
    if (this.editorComponent) {
      this.editorComponent.proyectoId = this.proyectoId || null;
    }
    
    this.proyectoForm.patchValue({
      titulo: proyecto.titulo,
      descripcion: proyecto.descripcion
    });
    
    if (this.editorComponent) {
      this.editorComponent.loadPlantilla(proyecto.data);
      this.mensaje = `Proyecto "${proyecto.titulo}" cargado correctamente`;
    }
    
    this.closeProjectsModal();
  }


  // Guardar proyecto (nuevo o existente)
    async guardarProyecto(): Promise<void> {
    if (this.proyectoForm.invalid) {
      this.mensaje = 'Por favor, ingresa un título para tu proyecto';
      return;
    }

    if (!this.editorComponent) {
      this.mensaje = 'Error: Editor no disponible';
      return;
    }

    if (!this.currentUser?.idUsuario) {
      this.mensaje = 'Error: Usuario no autenticado';
      return;
    }

    try {
      this.mensaje = '🔄 Guardando proyecto y generando portada...';

      const dataJSON = await this.editorComponent.saveToPlantilla();

      const proyectoRequest: ProyectoRequest = {
        titulo: this.proyectoForm.value.titulo,
        descripcion: this.proyectoForm.value.descripcion || '',
        data: dataJSON
      };

      let proyectoGuardado: Proyecto;

      if (this.proyectoSeleccionado?.idProyecto) {
        proyectoGuardado = await this.proyectoService.updateProyectoWithCapture(
          this.proyectoSeleccionado.idProyecto,
          proyectoRequest,
          this.editorContainer.nativeElement,
          this.currentUser.idUsuario
        );
      } else {
        proyectoGuardado = await this.proyectoService.createProyectoWithCapture(
          proyectoRequest,
          this.editorContainer.nativeElement,
          this.currentUser.idUsuario
        );
      }

      this.proyectoSeleccionado = proyectoGuardado;
      this.proyectoId = proyectoGuardado.idProyecto;
      
      this.mensaje = '✅ ¡Proyecto guardado correctamente con portada automática!';
      this.cargarProyectosUsuario();

      if (this.previsualizacionPortada) {
        URL.revokeObjectURL(this.previsualizacionPortada);
        this.previsualizacionPortada = null;
      }

    } catch (error) {
      console.error('❌ Error guardando proyecto:', error);
      this.mensaje = 'Error al guardar el proyecto: ' + (error as Error).message;
    }
  }


  ngOnDestroy(): void {
    if (this.previsualizacionPortada) {
      URL.revokeObjectURL(this.previsualizacionPortada);
    }
  }

  async previsualizarPortada(): Promise<void> {
    if (!this.editorContainer?.nativeElement) {
      this.mensaje = 'Editor no disponible para previsualización';
      return;
    }

    try {
      this.mensaje = '📸 Generando previsualización...';
      
      const imagenBlob = await this.captureService.captureEditor(this.editorContainer.nativeElement);
      this.previsualizacionPortada = URL.createObjectURL(imagenBlob);
      
      this.mensaje = '✅ Previsualización generada - Revisa la portada antes de guardar';
      
    } catch (error) {
      console.error('Error generando previsualización:', error);
      this.mensaje = 'Error al generar previsualización';
    }
  }


  private mostrarModalPrevisualizacion(imageUrl: any): void {
    // Implementar lógica para mostrar modal con la previsualización
    // Puedes usar un servicio de modal o crear uno simple
    this.previsualizacionPortada = imageUrl;
    
    // Ejemplo simple con window.open (puedes mejorar con un modal propio)
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Previsualización de Portada</title></head>
          <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0;">
            <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
            <p style="position: absolute; bottom: 10px; color: #666;">Esta es la portada que se guardará</p>
          </body>
        </html>
      `);
    }
  }

  async crearProyecto(proyectoRequest: ProyectoRequest): Promise<Proyecto> {
    return await lastValueFrom(
      this.proyectoService.createProyecto(proyectoRequest)
    );
  }

  actualizarProyecto(proyectoRequest: ProyectoRequest): void {
    if (!this.proyectoSeleccionado?.idProyecto) {
      this.mensaje = 'Error: ID de proyecto no válido';
      return;
    }

    this.proyectoService.updateProyecto(this.proyectoSeleccionado.idProyecto, proyectoRequest).subscribe({
      next: (proyecto) => {
        this.mensaje = 'Proyecto actualizado correctamente';
        this.proyectoSeleccionado = proyecto;
        this.cargarProyectosUsuario();
      },
      error: (err) => {
        console.error('Error actualizando proyecto', err);
        this.mensaje = 'Error al actualizar el proyecto';
      }
    });
  }

  // Eliminar proyecto
  eliminarProyecto(proyecto: Proyecto): void {
    if (!proyecto.idProyecto) {
      this.mensaje = 'Error: ID de proyecto no válido';
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar el proyecto "${proyecto.titulo}"?`)) {
      return;
    }

    this.proyectoService.deleteProyecto(proyecto.idProyecto).subscribe({
      next: () => {
        this.mensaje = `Proyecto "${proyecto.titulo}" eliminado correctamente`;
        
        // Si el proyecto eliminado era el seleccionado, limpiar selección
        if (this.proyectoSeleccionado?.idProyecto === proyecto.idProyecto) {
          this.nuevoProyecto();
        }
        
        this.cargarProyectosUsuario();
      },
      error: (err) => {
        console.error('Error eliminando proyecto', err);
        this.mensaje = 'Error al eliminar el proyecto';
      }
    });
  }

  // Nuevo proyecto
  nuevoProyecto(): void {
    this.proyectoSeleccionado = null;
    this.proyectoForm.reset();
    
    if (this.editorComponent) {
      this.editorComponent.limpiarEditor();
    }
    
    this.mensaje = 'Editor listo para crear un nuevo proyecto';
  }

  // Descargar proyecto como imagen
  descargarProyecto(): void {
    if (this.editorComponent) {
      this.editorComponent.exportAsImage();
      this.mensaje = 'Proyecto exportado como imagen';
    }
  }

  // Función rápida para empezar con plantilla
  empezarConPlantilla(plantilla: Plantilla): void {
    this.usarPlantilla(plantilla);
    this.proyectoForm.patchValue({
      titulo: `Mi ${plantilla.nombre}`,
      descripcion: `Basado en la plantilla: ${plantilla.descripcion}`
    });
  }

}
