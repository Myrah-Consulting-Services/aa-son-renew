import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartyLegers } from './party-legers';

describe('PartyLegers', () => {
  let component: PartyLegers;
  let fixture: ComponentFixture<PartyLegers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyLegers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartyLegers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
