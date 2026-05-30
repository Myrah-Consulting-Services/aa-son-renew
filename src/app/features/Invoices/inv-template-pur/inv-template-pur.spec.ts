import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvTemplatePur } from './inv-template-pur';

describe('InvTemplatePur', () => {
  let component: InvTemplatePur;
  let fixture: ComponentFixture<InvTemplatePur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvTemplatePur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvTemplatePur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
