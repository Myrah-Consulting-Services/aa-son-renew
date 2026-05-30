import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reconciliation } from './reconciliation';

describe('Reconciliation', () => {
  let component: Reconciliation;
  let fixture: ComponentFixture<Reconciliation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reconciliation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reconciliation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
