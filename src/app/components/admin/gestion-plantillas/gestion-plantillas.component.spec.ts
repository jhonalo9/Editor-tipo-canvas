import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPlantillasComponent } from './gestion-plantillas.component';

describe('GestionPlantillasComponent', () => {
  let component: GestionPlantillasComponent;
  let fixture: ComponentFixture<GestionPlantillasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPlantillasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPlantillasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
