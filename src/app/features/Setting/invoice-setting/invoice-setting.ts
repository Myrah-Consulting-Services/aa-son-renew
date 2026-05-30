import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface InvoiceTemplate {
  id: number;
  name: string;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyCountry: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  vatNumber: string;
  trnNumber: string;
  invoicePrefix: string;
  terms: string;
  footer: string;
}

@Component({
  selector: 'app-invoice-setting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-setting.html',
  styleUrl: './invoice-setting.scss'
})
export class InvoiceSetting {
  activeTab: number = 1;
  currentDate: Date = new Date();
  dueDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  templates: InvoiceTemplate[] = [
    {
      id: 1,
      name: 'Template 1',
      companyName: 'Al Rashid Trading LLC',
      companyAddress: 'Sheikh Zayed Road, Business Bay',
      companyCity: 'Dubai',
      companyState: 'Dubai',
      companyCountry: 'UAE',
      companyPhone: '+971 4 123 4567',
      companyEmail: 'info@alrashid.ae',
      companyWebsite: 'www.alrashid.ae',
      vatNumber: '123456789012345',
      trnNumber: 'TRN123456789012345',
      invoicePrefix: 'INV-2024-',
      terms: 'Payment due within 30 days. Late payment may incur additional charges.',
      footer: 'Thank you for your business!'
    },
    {
      id: 2,
      name: 'Template 2',
      companyName: 'Gulf Solutions FZE',
      companyAddress: 'Jebel Ali Free Zone, Dubai',
      companyCity: 'Dubai',
      companyState: 'Dubai',
      companyCountry: 'UAE',
      companyPhone: '+971 4 987 6543',
      companyEmail: 'contact@gulfsolutions.ae',
      companyWebsite: 'www.gulfsolutions.ae',
      vatNumber: '987654321098765',
      trnNumber: 'TRN987654321098765',
      invoicePrefix: 'GS-INV-2024-',
      terms: 'Net 45 days. All disputes subject to UAE jurisdiction.',
      footer: 'Quality service guaranteed!'
    }
  ];

  get activeTemplate(): InvoiceTemplate {
    return this.templates.find(t => t.id === this.activeTab) || this.templates[0];
  }

  setActiveTab(tabId: number): void {
    this.activeTab = tabId;
  }

  saveTemplate(): void {
    // Here you would typically save to backend
    console.log('Saving template:', this.activeTemplate);
    alert('Invoice template saved successfully!');
  }

  useTemplate(): void {
    // Here you would typically set this as the active template
    console.log('Using template:', this.activeTemplate);
    alert(`Template "${this.activeTemplate.name}" selected successfully!`);
  }

  updateTemplate(field: keyof InvoiceTemplate, value: string): void {
    const template = this.templates.find(t => t.id === this.activeTab);
    if (template) {
      (template as any)[field] = value;
    }
  }
}
