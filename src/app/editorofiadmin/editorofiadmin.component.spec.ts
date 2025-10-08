import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorofiadminComponent } from './editorofiadmin.component';

describe('EditorofiadminComponent', () => {
  let component: EditorofiadminComponent;
  let fixture: ComponentFixture<EditorofiadminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorofiadminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorofiadminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
