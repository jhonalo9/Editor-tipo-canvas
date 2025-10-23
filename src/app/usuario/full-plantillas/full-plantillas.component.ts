import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterModule,Router } from '@angular/router';
import { PlantillaService } from '../../core/services/plantilla.service';
import { FavoritoService } from '../../core/services/favorito.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../environment/environment';
import { HeaderComponent } from "../../components/header/header.component";
import { ProyectoService } from '../../core/services/proyecto.service';

@Component({
  selector: 'app-full-plantillas',
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './full-plantillas.component.html',
  styleUrl: './full-plantillas.component.css'
})
export class FullPlantillasComponent implements OnInit, OnDestroy {
 // Datos
  todasLasPlantillas: any[] = [];
  plantillasFiltradas: any[] = [];
  categorias: string[] = [];
  
  // Filtros
  terminoBusqueda: string = '';
  categoriaSeleccionada: string = '';
  
  // Estados
  cargando: boolean = false;
  error: string | null = null;
  cambiandoFavoritos = new Set<number>();
  
  // Modal
  modalVisible: boolean = false;
  plantillaSeleccionada: any = null;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private plantillaService: PlantillaService,
    private favoritoService: FavoritoService,
    private authService: AuthService,
    private proyectoService:ProyectoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.configurarBusqueda();
    this.cargarPlantillas();
  }

  configurarBusqueda(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.aplicarFiltros();
    });
  }

  cargarPlantillas(): void {
    this.cargando = true;
    this.error = null;

    this.plantillaService.getPlantillasPublicas().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (plantillas) => {
        this.todasLasPlantillas = this.procesarPlantillas(plantillas);
        this.extraerCategorias();
        this.aplicarFiltros();
        this.cargarEstadosFavoritos();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar plantillas:', error);
        this.error = 'No se pudieron cargar las plantillas. Por favor, intenta nuevamente.';
        this.cargando = false;
      }
    });
  }

  procesarPlantillas(plantillas: any[]): any[] {
    
    return plantillas.map((plantilla, index) => {
      
      if (plantilla.categoria && typeof plantilla.categoria === 'object') {
      }
      
      const data = this.plantillaService.parsePlantillaData(plantilla);
      const portadaUrl = data?.portadaUrl || data?.configuracionVisual?.portadaUrl;
      
      // Extraer categoría durante el procesamiento
      const categoria = this.extraerCategoria(plantilla, data);

      return {
        ...plantilla,
        data: data,
        portadaUrl: portadaUrl,
        favorito: false,
        _categoriaExtraida: categoria
      };
    });
  }

  extraerCategoria(plantilla: any, data: any): string {
    if (!plantilla && !data) return 'Sin categoría';

    // ✅ PRIORIDAD 1: Buscar en categoriaNombre (formato del backend)
    if (plantilla.categoriaNombre && typeof plantilla.categoriaNombre === 'string') {
      return plantilla.categoriaNombre.trim().charAt(0).toUpperCase() + plantilla.categoriaNombre.trim().slice(1).toLowerCase();
    }

    // ✅ PRIORIDAD 2: Buscar en el objeto plantilla.categoria (objeto Categoria completo)
    if (plantilla.categoria && typeof plantilla.categoria === 'object' && plantilla.categoria.nombre) {
      return plantilla.categoria.nombre.trim().charAt(0).toUpperCase() + plantilla.categoria.nombre.trim().slice(1).toLowerCase();
    }

    // Si la categoría viene como string directo (fallback)
    if (plantilla.categoria && typeof plantilla.categoria === 'string') {
      return plantilla.categoria.trim().charAt(0).toUpperCase() + plantilla.categoria.trim().slice(1).toLowerCase();
    }

    // Buscar en categoriaId como último recurso (solo tenemos el ID)
    if (plantilla.categoriaId) {
      console.log('Solo se encontró categoriaId:', plantilla.categoriaId);
      console.log('   Considera pedir al backend que incluya categoriaNombre');
    }
    return 'Sin categoría';
  }

  extraerCategorias(): void {    
    const categoriasSet = new Set<string>();
    let categoriasEncontradas = 0;

    this.todasLasPlantillas.forEach((plantilla, index) => {
      // Usar la categoría ya extraída durante el procesamiento
      const categoria = plantilla._categoriaExtraida || this.extraerCategoria(plantilla, plantilla.data);
      
      if (categoria && categoria !== 'Sin categoría') {
        categoriasSet.add(categoria);
        categoriasEncontradas++;
      }
      
    });

    this.categorias = Array.from(categoriasSet).sort();
  }

  cargarEstadosFavoritos(): void {
    if (!this.authService.isLoggedIn()) return;

    this.todasLasPlantillas.forEach(plantilla => {
      this.favoritoService.verificarFavorito(plantilla.id).subscribe({
        next: (favoritoInfo) => {
          plantilla.favorito = favoritoInfo.esFavorita;
        },
        error: (error) => {
          console.error(`Error al verificar favorito para plantilla ${plantilla.id}:`, error);
          plantilla.favorito = false;
        }
      });
    });
  }

  // Filtros y búsqueda
  onBuscarChange(): void {
    this.searchSubject.next(this.terminoBusqueda);
  }

  aplicarFiltros(): void {
    let plantillasFiltradas = [...this.todasLasPlantillas];

    // Filtro por búsqueda
    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      plantillasFiltradas = plantillasFiltradas.filter(plantilla =>
        plantilla.nombre.toLowerCase().includes(termino) ||
        plantilla.descripcion?.toLowerCase().includes(termino) ||
        this.getPlantillaCategoria(plantilla)?.toLowerCase().includes(termino)
      );
    }

    // Filtro por categoría
    if (this.categoriaSeleccionada) {
      plantillasFiltradas = plantillasFiltradas.filter(plantilla =>
        this.getPlantillaCategoria(plantilla) === this.categoriaSeleccionada
      );
    }

    this.plantillasFiltradas = plantillasFiltradas;
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.categoriaSeleccionada = '';
    this.aplicarFiltros();
  }

  get hayFiltrosActivos(): boolean {
    return !!this.terminoBusqueda || !!this.categoriaSeleccionada;
  }

  get totalPlantillas(): number {
    return this.todasLasPlantillas.length;
  }

  getPlantillaImage(plantilla: any): string {
    const portadaUrl = plantilla.portadaUrl;
    if (portadaUrl) {
      return this.construirUrlCompleta(portadaUrl);
    }

    const data = this.plantillaService.parsePlantillaData(plantilla);
    if (data?.portadaUrl) {
      return this.construirUrlCompleta(data.portadaUrl);
    }
    if (data?.configuracionVisual?.portadaUrl) {
      return this.construirUrlCompleta(data.configuracionVisual.portadaUrl);
    }

    return 'assets/images/placeholder-template.png';
  }

  private construirUrlCompleta(url: string): string {
    if (!url) return '';
    
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    const baseUrl = environment.apiUrl || '';
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    } else {
      return `${baseUrl}/${url}`;
    }
  }

  onImageError(event: any, plantilla: any): void {
    console.warn(`Error cargando imagen para plantilla ${plantilla.id}:`, plantilla.nombre);
    const img = event.target;
    img.src = 'assets/images/placeholder-template.png';
  }

  getPlantillaCategoria(plantilla: any): string {
    if (!plantilla) {
      return 'Sin categoría';
    }

    // Usar la categoría ya extraída durante el procesamiento
    if (plantilla._categoriaExtraida) {
      return plantilla._categoriaExtraida;
    }

    // ✅ PRIORIDAD 1: Buscar en plantilla.categoriaNombre (formato del backend)
    if (plantilla.categoriaNombre && typeof plantilla.categoriaNombre === 'string') {
      return plantilla.categoriaNombre;
    }

    // ✅ PRIORIDAD 2: Buscar en plantilla.categoria (objeto Categoria completo)
    if (plantilla.categoria && typeof plantilla.categoria === 'object' && plantilla.categoria.nombre) {
      return plantilla.categoria.nombre;
    }

    // Si la categoría viene como string directo
    if (plantilla.categoria && typeof plantilla.categoria === 'string') {
      return plantilla.categoria;
    }

    return 'Sin categoría';
  }

  // Favoritos
  toggleFavorito(plantilla: any, event: Event): void {
    event.stopPropagation();
    this.alternarFavorito(plantilla);
  }

  toggleFavoritoModal(plantilla: any, event: Event): void {
    event.stopPropagation();
    this.alternarFavorito(plantilla);
  }

  alternarFavorito(plantilla: any): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.cambiandoFavoritos.has(plantilla.id)) return;

    const estadoAnterior = plantilla.favorito;
    plantilla.favorito = !plantilla.favorito;
    this.cambiandoFavoritos.add(plantilla.id);

    this.favoritoService.toggleFavorito(plantilla.id).subscribe({
      next: (response) => {
        console.log('Favorito actualizado:', response.message);
        this.cambiandoFavoritos.delete(plantilla.id);
      },
      error: (error) => {
        console.error('Error al alternar favorito:', error);
        plantilla.favorito = estadoAnterior;
        this.cambiandoFavoritos.delete(plantilla.id);
        alert('Error al actualizar favorito. Intenta nuevamente.');
      }
    });
  }

  // Modal
  abrirModal(plantilla: any, event: Event): void {
    event.stopPropagation();
    this.plantillaSeleccionada = plantilla;
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.plantillaSeleccionada = null;
  }

  

  usarPlantilla(plantilla: any): void {
  
  const plantillaProcesada = {
    ...plantilla,
    data: plantilla.data || this.plantillaService.parsePlantillaData(plantilla)
  };
  // ✅ USAR NUEVO MÉTODO con interfaz correcta
  this.proyectoService.setProyectoTemporal({
    titulo: '', // Se llenará en crear-proyecto
    descripcion: '',
    plantillaId: plantilla.id,
    plantillaData: plantillaProcesada // ← Guardar plantilla completa
  });
if (this.authService.isLoggedIn()) {
  // Redirigir al formulario
  this.router.navigate(['/usuario/descripcion-proyect'], {
    queryParams: { plantillaId: plantilla.id }
  });

  } else {
      this.router.navigate(['/login']);
    }
}

  formatFecha(fechaString: string): string {
    if (!fechaString) return 'Fecha no disponible';
    
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
