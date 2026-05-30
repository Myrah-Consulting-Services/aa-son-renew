import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirTravelEarningCreate } from './air-travel-earning-create';

describe('AirTravelEarningCreate', () => {
  let component: AirTravelEarningCreate;
  let fixture: ComponentFixture<AirTravelEarningCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirTravelEarningCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AirTravelEarningCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
