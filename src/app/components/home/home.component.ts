import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PlantillaService, Plantilla, PlantillaEstadisticaDTO } from '../../core/services/plantilla.service'; // ✅ Importar Plantilla
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { FavoritoService } from '../../core/services/favorito.service';
import { ProyectoService} from '../../core/services/proyecto.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [
    CommonModule, 
    RouterModule,
    HeaderComponent
  ],
})
export class HomeComponent implements OnInit {
isLoggedIn = false;
  plantillas: Plantilla[] = []; 
  isLoading = true;

  constructor(
    private authService: AuthService,
    private plantillaService: PlantillaService,
    private favoritoService: FavoritoService,
    private proyectoService:ProyectoService,
    private router: Router

  ) {}

  modalVisible = false;
  plantillaSeleccionada: any = null;

  abrirModal(plantilla: any, event: Event) {
    event.stopPropagation();
    this.plantillaSeleccionada = plantilla;
    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
    this.plantillaSeleccionada = null;
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      // ✅ Siempre cargar las 12 plantillas más populares
      this.cargarPlantillasPopulares();
    });
  }

  // ✅ SOLO 12 PLANTILLAS MÁS POPULARES
  cargarPlantillasPopulares(): void {
    this.isLoading = true;
    
    this.plantillaService.getPlantillasPopulares().subscribe({
      next: (plantillasPopulares: PlantillaEstadisticaDTO[]) => {
        console.log('📊 Plantillas populares recibidas:', plantillasPopulares.length);
        
        // ✅ LIMITAR A SOLO 12 PLANTILLAS
        const plantillasLimitadas = plantillasPopulares.slice(0, 12);
        
        // ✅ Convertir a formato Plantilla
        this.plantillas = this.convertirYProcesarPlantillas(plantillasLimitadas);
        
        // ✅ Cargar estados de favoritos
        this.cargarEstadosFavoritos();
        this.isLoading = false;

        console.log(`✅ Mostrando ${this.plantillas.length} plantillas populares`);
      },
      error: (error) => {
        console.error('Error al cargar plantillas populares:', error);
        this.isLoading = false;
        this.plantillas = [];
      }
    });
  }

  // ✅ CORREGIDO: Usar solo métodos existentes
  private convertirYProcesarPlantillas(plantillasPopulares: PlantillaEstadisticaDTO[]): Plantilla[] {
    return plantillasPopulares.map(popular => {
      // ✅ Usar parsePlantillaData que SÍ existe
      const data = this.parsePlantillaEstadisticaData(popular);
      
      const portadaUrl = data?.portadaUrl || data?.configuracionVisual?.portadaUrl;
      
      // ✅ Crear objeto Plantilla
      const plantilla: Plantilla = {
        id: popular.id,
        nombre: popular.nombre,
        descripcion: popular.descripcion,
        data: data,
        estado: 'ACTIVA',
        esPublica: popular.esPublica,
        creadoPorId: 0,
        creadoPorNombre: popular.creadoPorNombre,
        fechaCreacion: popular.fechaCreacion,
        favorito: false
      };

      // ✅ Agregar portadaUrl para fácil acceso
      (plantilla as any).portadaUrl = portadaUrl;

      return plantilla;
    });
  }

  // ✅ NUEVO MÉTODO: Parsear datos de PlantillaEstadisticaDTO
  private parsePlantillaEstadisticaData(plantilla: PlantillaEstadisticaDTO): any {
    if (typeof plantilla.data === 'string') {
      try {
        return JSON.parse(plantilla.data);
      } catch (error) {
        console.error('Error parseando data de plantilla estadística:', error);
        return {};
      }
    }
    return plantilla.data;
  }

  cargarEstadosFavoritos(): void {
    if (!this.isLoggedIn) return;

    this.plantillas.forEach(plantilla => {
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

  toggleFavoritoModal(plantilla: any, event: Event): void {
    event.stopPropagation();
    
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    const estadoAnterior = plantilla.favorito;
    plantilla.favorito = !plantilla.favorito;

    this.favoritoService.toggleFavorito(plantilla.id).subscribe({
      next: (response) => {
        console.log('Favorito actualizado desde modal:', response.message);
        
        const plantillaEnLista = this.plantillas.find(p => p.id === plantilla.id);
        if (plantillaEnLista) {
          plantillaEnLista.favorito = plantilla.favorito;
        }
      },
      error: (error) => {
        console.error('Error al alternar favorito desde modal:', error);
        plantilla.favorito = estadoAnterior;
        alert('Error al actualizar favorito. Intenta nuevamente.');
      }
    });
  }

  toggleFavorito(plantilla: any, event: Event): void {
    event.stopPropagation();
    
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    const estadoAnterior = plantilla.favorito;
    plantilla.favorito = !plantilla.favorito;

    this.favoritoService.toggleFavorito(plantilla.id).subscribe({
      next: (response) => {
        console.log('Favorito actualizado:', response.message);
      },
      error: (error) => {
        console.error('Error al alternar favorito:', error);
        plantilla.favorito = estadoAnterior;
        alert('Error al actualizar favorito. Intenta nuevamente.');
      }
    });
  }

  getPlantillaImage(plantilla: Plantilla): string {
    const portadaUrl = (plantilla as any).portadaUrl;
    if (portadaUrl) {
      return portadaUrl;
    }

    const data = this.plantillaService.parsePlantillaData(plantilla);
    if (data?.portadaUrl) {
      return data.portadaUrl;
    }

    if (data?.configuracionVisual?.portadaUrl) {
      return data.configuracionVisual.portadaUrl;
    }

    return 'assets/images/placeholder-template.png';
  }

  onImageError(event: any, plantilla: Plantilla): void {
    const img = event.target;
    console.warn(`❌ Error cargando imagen para plantilla ${plantilla.id}:`, plantilla.nombre);
    img.src = 'assets/images/placeholder-template.png';
  }

  crearProyecto(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/usuario/descripcion-proyect']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  /*usarPlantilla(plantilla: Plantilla): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/usuario/descripcion-proyect'], { 
        state: { plantilla: plantilla } 
      });
    } else {
      this.router.navigate(['/login']);
    }
  }*/


  usarPlantilla(plantilla: any): void {
  console.log('✅ Plantilla seleccionada:', plantilla);
  
  // ✅ USAR NUEVO MÉTODO con interfaz correcta
  this.proyectoService.setProyectoTemporal({
    titulo: '', // Se llenará en crear-proyecto
    descripcion: '',
    plantillaId: plantilla.id,
    plantillaData: plantilla // ← Guardar plantilla completa
  });

  // Redirigir al formulario
  this.router.navigate(['/usuario/descripcion-proyect'], {
    queryParams: { plantillaId: plantilla.id }
  });
}

  getPlantillaTheme(plantilla: Plantilla): string {
    const data = this.plantillaService.parsePlantillaData(plantilla);
    return data?.theme || 'default';
  }

  getPlantillaColor(plantilla: Plantilla): string {
    const data = this.plantillaService.parsePlantillaData(plantilla);
    return data?.color || '#007bff';
  }
}