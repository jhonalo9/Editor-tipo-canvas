export interface Proyecto {
  id_proyecto?: number;
  id_usuario: number;
  id_plantilla_base?: number;
  titulo: string;
  descripcion?: string;
  data: string; // JSON string
}
