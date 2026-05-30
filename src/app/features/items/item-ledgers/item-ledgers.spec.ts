import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemLedgers } from './item-ledgers';

describe('ItemLedgers', () => {
  let component: ItemLedgers;
  let fixture: ComponentFixture<ItemLedgers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemLedgers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemLedgers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
