import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddParty } from './add-party';

describe('AddParty', () => {
  let component: AddParty;
  let fixture: ComponentFixture<AddParty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddParty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddParty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
