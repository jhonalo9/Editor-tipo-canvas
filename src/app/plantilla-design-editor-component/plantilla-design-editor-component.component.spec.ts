import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantillaDesignEditorComponentComponent } from './plantilla-design-editor-component.component';

describe('PlantillaDesignEditorComponentComponent', () => {
  let component: PlantillaDesignEditorComponentComponent;
  let fixture: ComponentFixture<PlantillaDesignEditorComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlantillaDesignEditorComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlantillaDesignEditorComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
