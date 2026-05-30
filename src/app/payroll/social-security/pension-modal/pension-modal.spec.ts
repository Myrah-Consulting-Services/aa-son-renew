import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PensionModal } from './pension-modal';

describe('PensionModal', () => {
  let component: PensionModal;
  let fixture: ComponentFixture<PensionModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PensionModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PensionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
