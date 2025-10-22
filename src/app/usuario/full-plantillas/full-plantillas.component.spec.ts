import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullPlantillasComponent } from './full-plantillas.component';

describe('FullPlantillasComponent', () => {
  let component: FullPlantillasComponent;
  let fixture: ComponentFixture<FullPlantillasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullPlantillasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullPlantillasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
