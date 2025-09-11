

import { PlantillaService } from '../../core/services/plantilla.service';
import { ProyectoService } from '../../core/services/proyecto.service';
import { AuthService } from '../../core/services/auth.service';

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { KonvaService } from '../../core/services/konva.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  @ViewChild('container', { static: true }) container!: ElementRef;
  
  stage: any;
  drawingColor: string = '#000000';
  brushSize: number = 5;

  constructor(private konvaService: KonvaService) {}

  ngOnInit(): void {
    this.initEditor();
  }

  initEditor(): void {
    this.stage = this.konvaService.initStage(this.container);
  }

  addEvent(): void {
    this.konvaService.createTimelineEvent(
      'Nuevo Evento',
      this.stage.width() / 2,
      this.stage.height() / 2
    );
  }

  addMilestone(): void {
    this.konvaService.createMilestone(
      'Hito Importante',
      this.stage.width() / 2,
      this.stage.height() / 2
    );
  }

  addText(): void {
    this.konvaService.addText(
      'Texto editable',
      this.stage.width() / 2,
      this.stage.height() / 2
    );
  }

  // Método corregido para cambiar color
  changeDrawingColor(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.drawingColor = input.value;
      this.konvaService.setDrawingColor(input.value);
    }
  }

  // Método corregido para cambiar tamaño de pincel
  changeBrushSize(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.brushSize = parseInt(input.value, 10);
      this.konvaService.setBrushSize(parseInt(input.value, 10));
    }
  }

  exportAsImage(): void {
    this.konvaService.exportAsImage(this.stage, 'mi-linea-de-tiempo');
  }

  // Métodos adicionales para formas
  addRectangle(): void {
    this.konvaService.addRectangle(
      this.stage.width() / 2,
      this.stage.height() / 2
    );
  }

  addCircle(): void {
    this.konvaService.addCircle(
      this.stage.width() / 2,
      this.stage.height() / 2
    );
  }
}
