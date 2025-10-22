import { Component, OnInit } from '@angular/core';
import { ActividadReciente, DashboardData, DashboardService, EstadisticasFavoritos, EstadisticasPlantillas, EstadisticasProyectos, EstadisticasUsuario, PlantillaFavorita, PlantillaMasUsada, PlantillaPopular } from '../../../core/services/dashboard.service';
import { VerticalHeaderComponent } from "../vertical-header/vertical-header.component";
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';


@Component({
  selector: 'app-dashboard',
  imports: [VerticalHeaderComponent,CommonModule,NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
 dashboardData: DashboardData | null = null;
  loading = true;
  error: string | null = null;

  chartUsuarios: any;
  chartPlantillas: any;
  chartProyectos: any;

  // Datos por defecto para evitar errores
  defaultEstadisticasUsuarios: EstadisticasUsuario = {
    totalUsuarios: 0,
    usuariosFree: 0,
    usuariosPremium: 0,
    usuariosAdmin: 0,
    crecimientoUsuarios: 0,
    usuariosActivos: 0
  };

  defaultEstadisticasPlantillas: EstadisticasPlantillas = {
    totalPlantillas: 0,
    plantillasPublicas: 0,
    plantillasPrivadas: 0,
    plantillasPopulares: [],
    plantillasMasUsadas: [],
    plantillasRecientes: []
  };

  defaultEstadisticasProyectos: EstadisticasProyectos = {
    totalProyectos: 0,
    proyectosRecientes: 0,
    proyectosPorUsuario: 0,
    crecimientoProyectos: 0
  };

  defaultEstadisticasFavoritos: EstadisticasFavoritos = {
    totalFavoritos: 0,
    plantillasMasPopulares: [],
    promedioFavoritosPorUsuario: 0
  };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.obtenerEstadisticasCompletas().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.prepararDatosGraficos();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error completo cargando dashboard:', error);
        this.error = `Error al cargar las estadísticas: ${error.status} - ${error.message}`;
        this.loading = false;
      }
    });
  }

  prepararDatosGraficos(): void {
    if (!this.dashboardData) return;

    const usuarios = this.dashboardData.estadisticasUsuarios || this.defaultEstadisticasUsuarios;
    const plantillas = this.dashboardData.estadisticasPlantillas || this.defaultEstadisticasPlantillas;
    const proyectos = this.dashboardData.estadisticasProyectos || this.defaultEstadisticasProyectos;

    this.chartUsuarios = {
      labels: ['Free', 'Premium', 'Admin'],
      datasets: [
        {
          data: [
            usuarios.usuariosFree,
            usuarios.usuariosPremium,
            usuarios.usuariosAdmin
          ],
          backgroundColor: ['#36A2EB', '#4BC0C0', '#FF6384'],
          hoverBackgroundColor: ['#36A2EB', '#4BC0C0', '#FF6384']
        }
      ]
    };

    this.chartPlantillas = {
      labels: ['Públicas', 'Privadas'],
      datasets: [
        {
          data: [
            plantillas.plantillasPublicas,
            plantillas.plantillasPrivadas
          ],
          backgroundColor: ['#FFCE56', '#9966FF'],
          hoverBackgroundColor: ['#FFCE56', '#9966FF']
        }
      ]
    };

    this.chartProyectos = {
      labels: ['Total Proyectos', 'Proyectos Recientes'],
      datasets: [
        {
          label: 'Proyectos',
          data: [
            proyectos.totalProyectos,
            proyectos.proyectosRecientes
          ],
          backgroundColor: ['#4BC0C0', '#36A2EB']
        }
      ]
    };
  }

  calcularPorcentaje(partial: number | undefined, total: number | undefined): number {
    if (!partial || !total || total === 0) return 0;
    return Math.round((partial / total) * 100);
  }

  formatearNumero(num: number | undefined | null): string {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return num.toLocaleString('es-ES');
  }

  recargar(): void {
    this.cargarDashboard();
  }

  // Getters seguros para el template
  get usuarios(): EstadisticasUsuario {
    return this.dashboardData?.estadisticasUsuarios || this.defaultEstadisticasUsuarios;
  }

  get plantillas(): EstadisticasPlantillas {
    return this.dashboardData?.estadisticasPlantillas || this.defaultEstadisticasPlantillas;
  }

  get proyectos(): EstadisticasProyectos {
    return this.dashboardData?.estadisticasProyectos || this.defaultEstadisticasProyectos;
  }

  get favoritos(): EstadisticasFavoritos {
    return this.dashboardData?.estadisticasFavoritos || this.defaultEstadisticasFavoritos;
  }

  get actividades(): ActividadReciente[] {
    return this.dashboardData?.ultimasActividades || [];
  }

  get plantillasPopulares(): PlantillaPopular[] {
    return this.plantillas.plantillasPopulares || [];
  }

  get plantillasMasUsadas(): PlantillaMasUsada[] {
    return this.plantillas.plantillasMasUsadas || [];
  }

  get plantillasFavoritas(): PlantillaFavorita[] {
    return this.favoritos.plantillasMasPopulares || [];
  }
}


