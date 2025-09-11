export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario';
}