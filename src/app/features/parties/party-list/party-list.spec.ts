import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartyList } from './party-list';

describe('PartyList', () => {
  let component: PartyList;
  let fixture: ComponentFixture<PartyList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartyList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
