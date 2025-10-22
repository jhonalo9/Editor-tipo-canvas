export interface TemplateListItem {
  id: number;
  nombre: string;
  descripcion: string;
  categoria?: Categoria;
  esPublica: boolean;
  estado?: string;
  metadatos: {
    fechaCreacion: Date;
    fechaModificacion: Date;
    vecesUsada: number;
    thumbnail?: string;
    portadaUrl?: string;
    portada?: string;
  };
  configuracionVisual: {
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor: string;
  };
  creadoPorId?: number;
  creadoPorNombre?: string;
}


export interface Categoria {
  id: number;
  nombre: string;
}
