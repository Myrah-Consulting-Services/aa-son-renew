import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingRequisition } from './pending-requisition';

describe('PendingRequisition', () => {
  let component: PendingRequisition;
  let fixture: ComponentFixture<PendingRequisition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingRequisition]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingRequisition);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
