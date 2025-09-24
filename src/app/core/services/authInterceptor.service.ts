import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token del servicio
    const token = this.authService.getToken();
    
    console.log('🔐 Interceptor - Token presente:', !!token);
    
    if (token) {
      // Clonar la request y añadir el header Authorization
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      
      console.log('✅ Headers de la request:', authReq.headers);
      return next.handle(authReq);
    }
    
    console.log('❌ Sin token, request sin modificar');
    return next.handle(req);
  }
}