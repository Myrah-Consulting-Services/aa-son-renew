import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutwardReq } from './outward-req';

describe('OutwardReq', () => {
  let component: OutwardReq;
  let fixture: ComponentFixture<OutwardReq>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutwardReq]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutwardReq);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
