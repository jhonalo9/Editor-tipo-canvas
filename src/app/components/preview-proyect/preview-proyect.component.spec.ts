import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewProyectComponent } from './preview-proyect.component';

describe('PreviewProyectComponent', () => {
  let component: PreviewProyectComponent;
  let fixture: ComponentFixture<PreviewProyectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewProyectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewProyectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
