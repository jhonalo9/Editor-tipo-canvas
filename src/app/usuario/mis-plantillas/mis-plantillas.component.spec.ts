import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisPlantillasComponent } from './mis-plantillas.component';

describe('MisPlantillasComponent', () => {
  let component: MisPlantillasComponent;
  let fixture: ComponentFixture<MisPlantillasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisPlantillasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisPlantillasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
