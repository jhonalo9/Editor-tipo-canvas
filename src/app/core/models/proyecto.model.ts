export interface Proyecto {
  idProyecto?: number;
  usuario: any;
  plantillaBase?: any;
  titulo: string;
  descripcion: string;
 data: {
    contenido: any;
    configuracion?: any;
    portadaUrl?: string;  // ✅ Ahora dentro de data
    [key: string]: any;
  };
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}
