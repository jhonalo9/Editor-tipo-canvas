import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradePremiumComponent } from './upgrade-premium.component';

describe('UpgradePremiumComponent', () => {
  let component: UpgradePremiumComponent;
  let fixture: ComponentFixture<UpgradePremiumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgradePremiumComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpgradePremiumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
