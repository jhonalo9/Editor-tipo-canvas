import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'range'
})
export class RangePipe implements PipeTransform {
  transform(value: number, count: number = 3): number[] {
    return Array.from({ length: Math.min(value, count) }, (_, i) => i);
  }
}