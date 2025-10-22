import { Component, OnInit, OnDestroy  } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil,forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FavoritoService, FavoritoResponseDTO } from '../../core/services/favorito.service';
import { AuthService } from '../../core/services/auth.service';
import { PlantillaService } from '../../core/services/plantilla.service';
import { Router } from '@angular/router';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-mis-favoritos',
  imports: [HeaderComponent, CommonModule, RouterModule],
  templateUrl: './mis-favoritos.component.html',
  styleUrl: './mis-favoritos.component.css'
})
export class MisFavoritosComponent implements OnInit, OnDestroy {

    plantillasFavoritas: any[] = [];
  cargando = false;
  error: string | null = null;
  totalFavoritos = 0;
  eliminandoFavoritos = new Set<number>();
  
  // Modal
  modalVisible = false;
  plantillaSeleccionada: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private favoritoService: FavoritoService,
    private plantillaService: PlantillaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarFavoritos();
    this.obtenerContadorFavoritos();
  }

  cargarFavoritos(): void {
    this.cargando = true;
    this.error = null;

    this.favoritoService.obtenerFavoritos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (favoritos: FavoritoResponseDTO[]) => {
          console.log('📦 Favoritos básicos recibidos:', favoritos);
          this.cargarInformacionCompletaPlantillas(favoritos);
        },
        error: (error) => {
          console.error('Error al cargar favoritos:', error);
          this.error = 'No se pudieron cargar tus favoritos. Por favor, intenta nuevamente.';
          this.cargando = false;
        }
      });
  }

  cargarInformacionCompletaPlantillas(favoritos: FavoritoResponseDTO[]): void {
    if (favoritos.length === 0) {
      this.plantillasFavoritas = [];
      this.cargando = false;
      return;
    }

    // Crear un array de observables para cargar la información completa de cada plantilla
    const requests = favoritos.map(favorito => 
      this.plantillaService.getPlantillaById(favorito.plantillaId).pipe(
        catchError(error => {
          console.error(`Error cargando plantilla ${favorito.plantillaId}:`, error);
          // Retornar un objeto con la información básica si falla
          return of({
            id: favorito.plantillaId,
            nombre: 'Plantilla no disponible',
            descripcion: 'No se pudo cargar la información',
            data: undefined,
            favorito: true,
            fechaAgregadoFavorito: favorito.fechaAgregado
          });
        })
      )
    );

    // Ejecutar todas las requests en paralelo
    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (plantillasCompletas: any[]) => {
          console.log('✅ Plantillas completas cargadas:', plantillasCompletas);
          this.plantillasFavoritas = plantillasCompletas.map((plantilla, index) => ({
            ...plantilla,
            favorito: true,
            fechaAgregadoFavorito: favoritos[index].fechaAgregado
          }));
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar información de plantillas:', error);
          this.error = 'Error al cargar la información de las plantillas.';
          this.cargando = false;
        }
      });
  }

  obtenerContadorFavoritos(): void {
    this.favoritoService.obtenerContadorFavoritos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalFavoritos = response.totalFavoritos;
        },
        error: (error) => {
          console.error('Error al obtener contador:', error);
        }
      });
  }

  getPlantillaImage(plantilla: any): string {
    console.log('🔍 Buscando imagen para plantilla:', plantilla);

    // 1. Buscar en data parseada
    const data = this.plantillaService.parsePlantillaData(plantilla);
    console.log('📊 Data parseada:', data);

    if (data?.portadaUrl) {
      console.log('✅ Encontrado en data.portadaUrl:', data.portadaUrl);
      return this.construirUrlCompleta(data.portadaUrl);
    }

    if (data?.configuracionVisual?.portadaUrl) {
      console.log('✅ Encontrado en data.configuracionVisual.portadaUrl:', data.configuracionVisual.portadaUrl);
      return this.construirUrlCompleta(data.configuracionVisual.portadaUrl);
    }

    // 2. Buscar en propiedades directas
    if (plantilla.portadaUrl) {
      console.log('✅ Encontrado en plantilla.portadaUrl:', plantilla.portadaUrl);
      return this.construirUrlCompleta(plantilla.portadaUrl);
    }

    // 3. Buscar en otras propiedades comunes
    const propiedadesImagen = [
      plantilla.imagenUrl,
      plantilla.thumbnailUrl,
      plantilla.previewUrl,
      plantilla.imageUrl,
      plantilla.urlImagen
    ];

    for (const prop of propiedadesImagen) {
      if (prop) {
        console.log('✅ Encontrado en propiedad alternativa:', prop);
        return this.construirUrlCompleta(prop);
      }
    }

    console.log('❌ No se encontró imagen, usando placeholder');
    return 'assets/images/placeholder-template.png';
  }

  private construirUrlCompleta(url: string): string {
    if (!url) return '';
    
    // Si ya es una URL completa, retornar tal cual
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    // Si es relativa, construir URL completa
    const baseUrl = environment.apiUrl || '';
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    } else {
      return `${baseUrl}/${url}`;
    }
  }

  onImageError(event: any, plantilla: any): void {
    console.warn(`❌ Error cargando imagen para plantilla ${plantilla.id}:`, plantilla.nombre);
    const img = event.target;
    img.src = 'assets/images/placeholder-template.png';
  }

  getPlantillaCategoria(plantilla: any): string {
    const data = this.plantillaService.parsePlantillaData(plantilla);
    return data?.categoria || data?.configuracionVisual?.categoria || '';
  }

  // Toggle favorito desde la grid
  toggleFavorito(plantilla: any, event: Event): void {
    event.stopPropagation();
    this.quitarDeFavoritos(plantilla.id);
  }

  // Toggle favorito desde el modal
  toggleFavoritoModal(plantilla: any, event: Event): void {
    event.stopPropagation();
    this.quitarDeFavoritos(plantilla.id);
  }

  quitarDeFavoritos(plantillaId: number): void {
    if (this.eliminandoFavoritos.has(plantillaId)) {
      return;
    }

    this.eliminandoFavoritos.add(plantillaId);

    this.favoritoService.eliminarFavorito(plantillaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Favorito eliminado:', response.message);
          
          // Remover de la lista local
          this.plantillasFavoritas = this.plantillasFavoritas.filter(p => p.id !== plantillaId);
          this.totalFavoritos--;
          
          this.eliminandoFavoritos.delete(plantillaId);
          
          // Cerrar modal si está abierto
          if (this.modalVisible && this.plantillaSeleccionada?.id === plantillaId) {
            this.cerrarModal();
          }
        },
        error: (error) => {
          console.error('Error al eliminar favorito:', error);
          this.error = 'Error al quitar de favoritos. Por favor, intenta nuevamente.';
          this.eliminandoFavoritos.delete(plantillaId);
        }
      });
  }

  // Modal methods
  abrirModal(plantilla: any, event: Event): void {
    event.stopPropagation();
    this.plantillaSeleccionada = plantilla;
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.plantillaSeleccionada = null;
  }

  // Navegación
  usarPlantilla(plantilla: any): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/usuario/descripcion-proyect'], { 
        state: { plantilla: plantilla } 
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
