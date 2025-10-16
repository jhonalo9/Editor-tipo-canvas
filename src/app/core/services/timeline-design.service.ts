// services/timeline-design.service.ts
import { Injectable } from '@angular/core';
import { TimelineDesign ,LineStyle, MarkerStyle} from '../models/timeline-design.interface';


@Injectable({
  providedIn: 'root'
})
export class TimelineDesignService {
  private timelineDesigns: TimelineDesign[] = [
    // Línea horizontal clásica (actual)
    {
      id: 'classic-line',
      name: 'Línea Horizontal Clásica',
      description: 'Línea recta horizontal tradicional',
      layout: {
        type: 'horizontal',
        orientation: 'center'
      },
      lineStyle: {
        stroke: '#070707ff',
        strokeWidth: 5,
        strokeStyle: 'solid',
        lineCap: 'round'
      },
      markers: [{
          type: 'year',
          position: 'both',
          interval: 10,
          style: {
            size: 4,
            color: '#070707ff',
            shape: 'line',
            label: {
              show: true,
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#2c3e50',
              position: 'outside'
            }
          }}]
    },
    // Línea vertical
    {
      id: 'vertical-line',
      name: 'Línea Vertical',
      description: 'Línea recta vertical',
      layout: {
        type: 'vertical',
        orientation: 'center'
      },
      lineStyle: {
        stroke: '#070707ff',
        strokeWidth: 5,
        strokeStyle: 'solid',
        lineCap: 'round'
      },
      markers: [{
          type: 'year',
          position: 'both',
          interval: 10,
          style: {
            size: 4,
            color: '#070707ff',
            shape: 'line',
            label: {
              show: true,
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#2c3e50',
              position: 'outside'
            }
          }}]
    },
    // Línea curva
    {
      id: 'curved-line',
      name: 'Línea Curva',
      description: 'Línea con curvatura suave',
      layout: {
        type: 'curve',
        orientation: 'center',
        curvature: 0.3
      },
      lineStyle: {
        stroke: '#070707ff',
        strokeWidth: 5,
        strokeStyle: 'solid',
        lineCap: 'round'
      },
      markers: [{
          type: 'year',
          position: 'both',
          interval: 10,
          style: {
            size: 4,
            color: '#070707ff',
            shape: 'line',
            label: {
              show: true,
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#2c3e50',
              position: 'outside'
            }
          }}]
    },
    // Línea ondulada
    {
      id: 'wave-line',
      name: 'Línea Ondulada',
      description: 'Línea con forma de onda',
      layout: {
        type: 'wave',
        orientation: 'center',
        amplitude: 30,
        frequency: 0.02
      },
      lineStyle: {
        stroke: '#070707ff',
        strokeWidth: 3,
        strokeStyle: 'solid',
        lineCap: 'round'
      },
      markers: [{
          type: 'year',
          position: 'both',
          interval: 10,
          style: {
            size: 4,
            color: '#070707ff',
            shape: 'line',
            label: {
              show: true,
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#2c3e50',
              position: 'outside'
            }
          }}]
    },
    // Línea en zigzag
    {
      id: 'zigzag-line',
      name: 'Línea Zigzag',
      description: 'Línea con forma de zigzag',
      layout: {
        type: 'zigzag',
        orientation: 'center',
        amplitude: 40,
        frequency: 0.05,
        segments: 20
      },
      lineStyle: {
        stroke: '#070707ff',
        strokeWidth: 3,
        strokeStyle: 'solid',
        lineCap: 'round'
      },
     markers: [{
          type: 'year',
          position: 'both',
          interval: 10,
          style: {
            size: 4,
            color: '#070707ff',
            shape: 'line',
            label: {
              show: true,
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#2c3e50',
              position: 'outside'
            }
          }}]
    },
    // Línea espiral (experimental)
    {
      id: 'spiral-line',
      name: 'Línea Espiral',
      description: 'Línea en forma de espiral',
      layout: {
        type: 'spiral',
        orientation: 'center',
        segments: 36
      },
      lineStyle: {
        stroke: '#070707ff',
        strokeWidth: 2,
        strokeStyle: 'solid',
        lineCap: 'round'
      },
      markers: [{
          type: 'year',
          position: 'both',
          interval: 10,
          style: {
            size: 4,
            color: '#070707ff',
            shape: 'line',
            label: {
              show: true,
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#2c3e50',
              position: 'outside'
            }
          }}]
    }
  ];

  getTimelineDesigns(): TimelineDesign[] {
    return this.timelineDesigns;
  }

  getTimelineDesignById(id: string): TimelineDesign | undefined {
    return this.timelineDesigns.find(design => design.id === id);
  }

  saveTimelineDesign(design: TimelineDesign): void {
    const index = this.timelineDesigns.findIndex(d => d.id === design.id);
    if (index >= 0) {
      this.timelineDesigns[index] = design;
    } else {
      this.timelineDesigns.push(design);
    }
    localStorage.setItem('timeline-designs', JSON.stringify(this.timelineDesigns));
  }

  deleteTimelineDesign(id: string): void {
    this.timelineDesigns = this.timelineDesigns.filter(design => design.id !== id);
    localStorage.setItem('timeline-designs', JSON.stringify(this.timelineDesigns));
  }
}