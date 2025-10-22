import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalHeaderComponent } from './vertical-header.component';

describe('VerticalHeaderComponent', () => {
  let component: VerticalHeaderComponent;
  let fixture: ComponentFixture<VerticalHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerticalHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerticalHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
