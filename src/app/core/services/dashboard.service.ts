import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface EstadisticasUsuario {
  totalUsuarios: number;
  usuariosFree: number;
  usuariosPremium: number;
  usuariosAdmin: number;
  crecimientoUsuarios: number;
  usuariosActivos: number;
  usuariosUltimos30Dias?: number;
  distribucionPorRol?: any;
}

export interface PlantillaPopular {
  id: number;
  nombre: string;
  totalFavoritos: number;
  categoria: string;
}

export interface PlantillaMasUsada {
  id: number;
  nombre: string;
  totalUsos: number;
  categoria: string;
}

export interface EstadisticasPlantillas {
  totalPlantillas: number;
  plantillasPublicas: number;
  plantillasPrivadas: number;
  plantillasPopulares: PlantillaPopular[];
  plantillasMasUsadas: PlantillaMasUsada[];
  plantillasRecientes: any[];
}

export interface EstadisticasProyectos {
  totalProyectos: number;
  proyectosRecientes: number;
  proyectosPorUsuario: number;
  crecimientoProyectos: number;
}

export interface PlantillaFavorita {
  id: number;
  nombre: string;
  totalFavoritos: number;
}

export interface EstadisticasFavoritos {
  totalFavoritos: number;
  plantillasMasPopulares: PlantillaFavorita[];
  promedioFavoritosPorUsuario: number;
}

export interface ActividadReciente {
  tipo: string;
  mensaje: string;
  fecha: Date;
  icono: string;
}

export interface DashboardData {
  estadisticasUsuarios: EstadisticasUsuario;
  estadisticasPlantillas: EstadisticasPlantillas;
  estadisticasProyectos: EstadisticasProyectos;
  estadisticasFavoritos: EstadisticasFavoritos;
  ultimasActividades: ActividadReciente[];
}
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
    // CORREGIR: Asegúrate de que apiUrl sea una string simple
  private apiUrl = environment.apiUrl; // ← Esto debe ser una string

  constructor(private http: HttpClient) {
    console.log('DashboardService API URL:', this.apiUrl); // Para debug
  }

  obtenerEstadisticasCompletas(): Observable<any> {
    console.log('Obteniendo estadísticas completas...'); // Debug
    
    return forkJoin({
      estadisticasUsuarios: this.obtenerEstadisticasUsuarios(),
      estadisticasPlantillas: this.obtenerEstadisticasPlantillas(),
      estadisticasProyectos: this.obtenerEstadisticasProyectos(),
      estadisticasFavoritos: this.obtenerEstadisticasFavoritos()
    }).pipe(
      map(data => {
        return {
          ...data,
          ultimasActividades: this.generarActividadesRecientes(data)
        };
      })
    );
  }

 obtenerEstadisticasUsuarios(): Observable<EstadisticasUsuario> {
  const url = `${this.apiUrl}/usuarios/estadisticas`;
  console.log('URL usuarios:', url);

  return this.http.get<any>(url).pipe(
    map(data => {
      const distribucionPorRol = data.distribucionPorRol || {};
      const distribucionPorPlan = data.distribucionPorPlan || {};
      const totalUsuarios = data.totalUsuarios || 0;

      // 📊 Extraemos datos del backend
      const usuariosAdmin = distribucionPorRol.ADMIN || 0;
      const totalUsuariosRegulares = distribucionPorRol.USUARIO || 0;
      
      // 🎯 Obtenemos usuarios FREE del plan
      const usuariosFree = distribucionPorPlan.FREE || data.usuariosFree || 0;
      
      // ✅ CÁLCULO CORRECTO: Premium = Total Usuarios Regulares - Free
      const usuariosPremium = totalUsuariosRegulares - usuariosFree;


      // 🧮 Cálculos de porcentaje
      let porcentajeFree = totalUsuarios > 0 ? Math.round((usuariosFree / totalUsuarios) * 100) : 0;
      let porcentajePremium = totalUsuarios > 0 ? Math.round((usuariosPremium / totalUsuarios) * 100) : 0;
      let porcentajeAdmin = totalUsuarios > 0 ? Math.round((usuariosAdmin / totalUsuarios) * 100) : 0;

      // ⚖️ Corrección: ajustamos porcentajes si superan o no llegan a 100 por redondeo
      const sumaPorcentajes = porcentajeFree + porcentajePremium + porcentajeAdmin;
      if (sumaPorcentajes !== 100) {
        const diferencia = 100 - sumaPorcentajes;
        // Ajustamos el rol con mayor cantidad de usuarios
        if (usuariosFree >= usuariosPremium && usuariosFree >= usuariosAdmin) {
          porcentajeFree += diferencia;
        } else if (usuariosPremium >= usuariosFree && usuariosPremium >= usuariosAdmin) {
          porcentajePremium += diferencia;
        } else {
          porcentajeAdmin += diferencia;
        }
      }

      return {
        totalUsuarios,
        usuariosFree,
        usuariosPremium,
        usuariosAdmin,
        crecimientoUsuarios: data.usuariosUltimos30Dias || 0,
        usuariosActivos: data.usuariosUltimos30Dias || 0,
        usuariosUltimos30Dias: data.usuariosUltimos30Dias || 0,
        distribucionPorRol: {
          ADMIN: usuariosAdmin,
          FREE: usuariosFree,
          PREMIUM: usuariosPremium,
          porcentajeFree,
          porcentajePremium,
          porcentajeAdmin
        }
      };
    })
  );
}



  obtenerEstadisticasPlantillas(): Observable<any> {
    return forkJoin({
      adminStats: this.http.get<any>(`${this.apiUrl}/plantillas/admin/estadisticas`),
      populares: this.http.get<any[]>(`${this.apiUrl}/plantillas/populares`),
      masUsadas: this.http.get<any[]>(`${this.apiUrl}/plantillas/mas-usadas`),
      recientes: this.http.get<any[]>(`${this.apiUrl}/plantillas/recientes`)
    }).pipe(
      map(data => ({
        totalPlantillas: data.adminStats?.totalPlantillas || 0,
        plantillasPublicas: data.adminStats?.plantillasPublicas || 0,
        plantillasPrivadas: data.adminStats?.plantillasPrivadas || 0,
        plantillasPopulares: (data.populares || []).map((p: any) => ({
  id: p.id,
  nombre: p.nombre,
  totalFavoritos: p.conteo,
  categoria: p.categoriaNombre
})),
        plantillasMasUsadas: (data.masUsadas || []).map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        totalUsos: p.conteo || 0,
        categoria: p.categoriaNombre || ''
      })),
        plantillasRecientes: data.recientes || []
      }))
    );
  }

 obtenerEstadisticasProyectos(): Observable<any> {
  // Usa el endpoint de admin que incluye toda la información
  return this.http.get<any>(`${this.apiUrl}/proyectos/admin/estadisticas`).pipe(
    map(data => ({
      totalProyectos: data?.totalProyectos || 0,
      proyectosRecientes: data?.proyectosRecientes || 0,  // Proyectos últimos 30 días
      proyectosPorUsuario: data?.proyectosPorUsuario || 0,
      crecimientoProyectos: data?.crecimientoProyectos || 0,
      ultimosProyectos: data?.ultimosProyectos || []  // Lista de proyectos recientes
    }))
  );
}

  obtenerEstadisticasFavoritos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/favoritos/admin/estadisticas`).pipe(
      map(data => ({
        totalFavoritos: data?.totalFavoritos || 0,
        plantillasMasPopulares: data?.plantillasMasPopulares || [],
        promedioFavoritosPorUsuario: data?.promedioFavoritosPorUsuario || 0
      }))
    );
  }

  private generarActividadesRecientes(data: any): any[] {
    const actividades = [];
    
    if (data.estadisticasUsuarios?.crecimientoUsuarios > 0) {
      actividades.push({
        tipo: 'usuario',
        mensaje: `${data.estadisticasUsuarios.crecimientoUsuarios} nuevos usuarios registrados`,
        fecha: new Date(),
        icono: 'fas fa-users'
      });
    }

    if (data.estadisticasPlantillas?.plantillasRecientes?.length > 0) {
      actividades.push({
        tipo: 'plantilla',
        mensaje: `${data.estadisticasPlantillas.plantillasRecientes.length} nuevas plantillas creadas`,
        fecha: new Date(),
        icono: 'fas fa-layer-group'
      });
    }

    if (data.estadisticasProyectos?.proyectosRecientes > 0) {
      actividades.push({
        tipo: 'proyecto',
        mensaje: `${data.estadisticasProyectos.proyectosRecientes} nuevos proyectos creados`,
        fecha: new Date(),
        icono: 'fas fa-project-diagram'
      });
    }

    return actividades.slice(0, 5);
  }
}