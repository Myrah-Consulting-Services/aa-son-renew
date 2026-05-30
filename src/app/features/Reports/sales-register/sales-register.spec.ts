import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesRegister } from './sales-register';

describe('SalesRegister', () => {
  let component: SalesRegister;
  let fixture: ComponentFixture<SalesRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesRegister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
