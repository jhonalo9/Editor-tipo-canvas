import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class CaptureService {

  constructor(private sanitizer: DomSanitizer) { }

  /**
   * Captura el contenido del editor como imagen
   */
  async captureEditor(editorElement: HTMLElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.loadHtml2Canvas().then(() => {
        // @ts-ignore
        html2canvas(editorElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 800,
          height: 600
        }).then((canvas: HTMLCanvasElement) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al generar imagen'));
            }
          }, 'image/png', 0.9);
        }).catch(reject);
      }).catch(reject);
    });
  }

  private loadHtml2Canvas(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).html2canvas !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error cargando html2canvas'));
      document.head.appendChild(script);
    });
  }

  blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { 
      type: blob.type,
      lastModified: Date.now()
    });
  }

  createObjectURL(blob: Blob): SafeUrl {
    const url = URL.createObjectURL(blob);
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}