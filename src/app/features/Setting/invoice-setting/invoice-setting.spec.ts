import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InvoiceSetting } from './invoice-setting';

describe('InvoiceSetting', () => {
  let component: InvoiceSetting;
  let fixture: ComponentFixture<InvoiceSetting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceSetting, CommonModule, FormsModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InvoiceSetting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have two templates by default', () => {
    expect(component.templates.length).toBe(2);
  });

  it('should set active tab correctly', () => {
    component.setActiveTab(2);
    expect(component.activeTab).toBe(2);
  });

  it('should return correct active template', () => {
    component.setActiveTab(1);
    expect(component.activeTemplate.id).toBe(1);
    
    component.setActiveTab(2);
    expect(component.activeTemplate.id).toBe(2);
  });

  it('should use template', () => {
    spyOn(window, 'alert');
    component.useTemplate();
    expect(window.alert).toHaveBeenCalledWith('Template "Template 1" selected successfully!');
  });

  it('should have current and due dates', () => {
    expect(component.currentDate).toBeInstanceOf(Date);
    expect(component.dueDate).toBeInstanceOf(Date);
  });
});
