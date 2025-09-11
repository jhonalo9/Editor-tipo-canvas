import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminplantillaComponent } from './adminplantilla.component';

describe('AdminplantillaComponent', () => {
  let component: AdminplantillaComponent;
  let fixture: ComponentFixture<AdminplantillaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminplantillaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminplantillaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
