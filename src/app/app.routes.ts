import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { EditorAdminComponent } from './components/admin/editor-admin/editor-admin.component';
import { GestionPlantillasComponent } from './components/admin/gestion-plantillas/gestion-plantillas.component';
import { EditorUsuarioComponent } from './usuario/editor-usuario/editor-usuario.component';
import { MisProyectosComponent } from './usuario/mis-proyectos/mis-proyectos.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { AdminPlantillaComponent } from './components/adminplantilla/adminplantilla.component';
import { EditorComponent } from './components/editor/editor.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
   path: 'admin/plantillas',
  component: AdminPlantillaComponent,

},
  { path: 'editor', component: EditorComponent },

  /*{ path: 'admin/plantillas', component: GestionPlantillasComponent, canActivate: [AdminGuard] },*/
  { path: 'usuario/editor/:id', component: EditorComponent},
  { path: 'usuario/proyectos', component: MisProyectosComponent },
  
 


];