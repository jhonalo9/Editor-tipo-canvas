import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorAdminComponent } from './editor-admin.component';

describe('EditorAdminComponent', () => {
  let component: EditorAdminComponent;
  let fixture: ComponentFixture<EditorAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
