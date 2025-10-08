import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEditorOficialComponent } from './admin-editor-oficial.component';

describe('AdminEditorOficialComponent', () => {
  let component: AdminEditorOficialComponent;
  let fixture: ComponentFixture<AdminEditorOficialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEditorOficialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEditorOficialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
