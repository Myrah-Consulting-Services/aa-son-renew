import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartyWiseBill } from './party-wise-bill';

describe('PartyWiseBill', () => {
  let component: PartyWiseBill;
  let fixture: ComponentFixture<PartyWiseBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyWiseBill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartyWiseBill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
