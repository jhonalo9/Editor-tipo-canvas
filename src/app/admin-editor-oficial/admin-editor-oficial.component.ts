import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TemplateLayout, TemplateService, TemplateStyles, TimelineTemplate } from '../core/services/template.service';

interface TimelineEvent {
  year: number;
  title: string;
  person: string;
  description: string;
  image?: string;
}

@Component({
  selector: 'app-admin-editor-oficial',
  templateUrl: './admin-editor-oficial.component.html',
  styleUrl: './admin-editor-oficial.component.css',
  imports: [CommonModule, FormsModule]
})
export class AdminEditorOficialComponent implements OnInit {
  templates: TimelineTemplate[] = [];
  showTemplateModal: boolean = false;
  editingTemplate: TimelineTemplate | null = null;
  previewStyles: any = {};

  newTemplate: TimelineTemplate = {
    name: '',
    description: '',
    category: 'Personalizado',
    createdBy: 'admin',
    createdAt: new Date(),
    isPublic: true,
    styles: this.getDefaultStyles(),
    layout: this.getDefaultLayout()
  };

  // Opciones predefinidas para selects
  fontFamilies = ['Arial, sans-serif', 'Georgia, serif', 'Segoe UI, sans-serif', 'Verdana, sans-serif'];
  imageStyles = ['circle', 'square', 'rounded'];
  connectorStyles = ['solid', 'dashed', 'dotted'];
  timelinePositions = ['top', 'center', 'bottom'];
  eventOrientations = ['alternate', 'above', 'below'];
  markerStyles = ['dot', 'line', 'icon'];

  constructor(private templateService: TemplateService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.templates = this.templateService.getTemplates();
  }

  createTemplate(): void {
    this.editingTemplate = null;
    this.newTemplate = {
      name: '',
      description: '',
      category: 'Personalizado',
      createdBy: 'admin',
      createdAt: new Date(),
      isPublic: true,
      styles: this.getDefaultStyles(),
      layout: this.getDefaultLayout()
    };
    this.updatePreview();
    this.showTemplateModal = true;
  }

  editTemplate(template: TimelineTemplate): void {
    this.editingTemplate = template;
    this.newTemplate = { ...template };
    this.updatePreview();
    this.showTemplateModal = true;
  }

  saveTemplate(): void {
    if (!this.newTemplate.name.trim()) {
      alert('El nombre de la plantilla es requerido');
      return;
    }

    this.templateService.saveTemplate(this.newTemplate);
    this.loadTemplates();
    this.closeTemplateModal();
  }

  deleteTemplate(template: TimelineTemplate): void {
    if (confirm(`¿Eliminar la plantilla "${template.name}"?`)) {
      this.templateService.deleteTemplate(template.id!);
      this.loadTemplates();
    }
  }

  closeTemplateModal(): void {
    this.showTemplateModal = false;
    this.editingTemplate = null;
  }

  // Actualizar preview en tiempo real
  updatePreview(): void {
    this.previewStyles = {
      'background-color': this.newTemplate.styles.backgroundColor,
      'color': this.newTemplate.styles.textColor,
      'font-family': this.newTemplate.styles.fontFamily.split(',')[0]
    };
  }

  onStyleChange(): void {
    this.updatePreview();
  }

  private getDefaultStyles(): TemplateStyles {
    return {
      backgroundColor: '#ffffff',
      timelineColor: '#2c3e50',
      eventColor: '#3498db',
      textColor: '#2c3e50',
      accentColor: '#e74c3c',
      fontFamily: 'Arial, sans-serif',
      titleFontSize: 14,
      yearFontSize: 12,
      imageStyle: 'circle',
      imageSize: 80,
      imageBorder: true,
      shadows: true,
      animations: true,
      connectorStyle: 'dashed'
    };
  }

  private getDefaultLayout(): TemplateLayout {
    return {
      timelinePosition: 'center',
      eventOrientation: 'alternate',
      eventSpacing: 120,
      markerStyle: 'dot',
      compactMode: false
    };
  }

  trackByTemplateId(index: number, template: TimelineTemplate): string {
    return template.id || index.toString();
  }
}