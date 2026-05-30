import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseForm } from './warehouse-form';

describe('WarehouseForm', () => {
  let component: WarehouseForm;
  let fixture: ComponentFixture<WarehouseForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehouseForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehouseForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
