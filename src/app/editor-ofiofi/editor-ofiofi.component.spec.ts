import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorOFIofiComponent } from './editor-ofiofi.component';

describe('EditorOFIofiComponent', () => {
  let component: EditorOFIofiComponent;
  let fixture: ComponentFixture<EditorOFIofiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorOFIofiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorOFIofiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
