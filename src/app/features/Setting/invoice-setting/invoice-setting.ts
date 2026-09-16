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
      companyName: 'Nablus Road Contracting',
      companyAddress: 'Warehouse 14, Al Quoz Industrial Area 3',
      companyCity: 'Dubai',
      companyState: 'Dubai',
      companyCountry: 'UAE',
      companyPhone: '+971 4 338 2140',
      companyEmail: 'info@nablusroad.ae',
      companyWebsite: 'www.nablusroad.ae',
      vatNumber: '100456789012345',
      trnNumber: '100456789012345',
      invoicePrefix: 'NRC-INV-2026-',
      terms: 'Payment due within 30 days of invoice. Progress claims as per contract milestones.',
      footer: 'Thank you for choosing Nablus Road Contracting.'
    },
    {
      id: 2,
      name: 'Template 2',
      companyName: 'Nablus Road Contracting',
      companyAddress: 'P.O. Box 118820, Al Quoz Industrial Area 3',
      companyCity: 'Dubai',
      companyState: 'Dubai',
      companyCountry: 'UAE',
      companyPhone: '+971 50 612 8840',
      companyEmail: 'accounts@nablusroad.ae',
      companyWebsite: 'www.nablusroad.ae',
      vatNumber: '100456789012345',
      trnNumber: '100456789012345',
      invoicePrefix: 'NRC-TAX-2026-',
      terms: 'Net 45 days. All disputes subject to Dubai Courts jurisdiction.',
      footer: 'Quality road works — Dubai based since day one.'
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
