import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JvList } from './jv-list';

describe('JvList', () => {
  let component: JvList;
  let fixture: ComponentFixture<JvList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JvList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JvList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
