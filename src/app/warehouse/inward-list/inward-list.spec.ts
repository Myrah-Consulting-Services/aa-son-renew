import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InwardList } from './inward-list';

describe('InwardList', () => {
  let component: InwardList;
  let fixture: ComponentFixture<InwardList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InwardList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InwardList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
