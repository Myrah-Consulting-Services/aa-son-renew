import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrunDrawer } from './payrun-drawer';

describe('PayrunDrawer', () => {
  let component: PayrunDrawer;
  let fixture: ComponentFixture<PayrunDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrunDrawer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrunDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
