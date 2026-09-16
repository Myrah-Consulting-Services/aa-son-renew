import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface AuditCarton {
  rfidTagId: string;
  productName: string;
  cartonNo: string;
  sku: string;
  location: string;
  qtyExpected: number;
  qtyScanned: number;
  status: 'Matched' | 'Missing' | 'Unexpected';
}

@Component({
  selector: 'app-inventory-audit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inventory-audit.html',
  styleUrl: './inventory-audit.scss'
})
export class InventoryAudit {
  private readonly locations = [
    'Zone A / Rack R1',
    'Zone A / Rack R2',
    'Zone A / Rack R3',
    'Zone B / Rack R1',
    'Zone B / Rack R2',
    'Zone B / Rack R3',
    'Zone C / Rack R1',
    'Zone C / Rack R2'
  ];

  /** Real tags from handheld reader + generated IDs for remaining materials */
  private readonly rfidTagIds = [
    'E2801191A50400765DE3CB19',
    'E2801191A50400765DE29579',
    'E2801191A50400765DE24BFA',
    'E2801191A50400765DE91065',
    'E2801191A50400765DE910B4',
    'E2801191A50400765DE1A2B3',
    'E2801191A50400765DE4C5D6',
    'E2801191A50400765DE7E8F9',
    'E2801191A50400765DEA1B2C',
    'E2801191A50400765DED3E4F',
    'E2801191A50400765DE5F6A7',
    'E2801191A50400765DE8B9C0',
    'E2801191A50400765DE0D1E2',
    'E2801191A50400765DE3F4A5',
    'E2801191A50400765DE6B7C8',
    'E2801191A50400765DE9D0E1',
    'E2801191A50400765DE2F3A4',
    'E2801191A50400765DE5B6C7',
    'E2801191A50400765DE8D9E0',
    'E2801191A50400765DE1F2A3',
    'E2801191A50400765DE4B5C6',
    'E2801191A50400765DE7D8E9',
    'E2801191A50400765DEA0B1C',
    'E2801191A50400765DED2E3F'
  ];

  auditMeta = {
    auditId: 'AUD-RFID-20260718-001',
    warehouse: 'Main Warehouse',
    scannedBy: 'Handheld RFID Reader',
    scannedAt: '2026-07-18 17:43',
    expected: 24,
    scanned: 24
  };

  /** Mock RFID scan — 24 of 24 cartons matched (RFID Material 1–24) */
  cartons: AuditCarton[] = this.buildCartons();

  private buildCartons(): AuditCarton[] {
    return this.rfidTagIds.map((rfidTagId, index) => {
      const n = index + 1;
      const padded = String(n).padStart(2, '0');
      return {
        rfidTagId,
        productName: `RFID Material ${n}`,
        cartonNo: `CTN-RFID-${padded}`,
        sku: `RFID-MAT-${padded}`,
        location: this.locations[index % this.locations.length],
        qtyExpected: 1,
        qtyScanned: 1,
        status: 'Matched' as const
      };
    });
  }

  get matchedCount(): number {
    return this.cartons.filter(c => c.status === 'Matched').length;
  }

  get missingCount(): number {
    return this.cartons.filter(c => c.status === 'Missing').length;
  }

  get accuracyPct(): number {
    if (!this.auditMeta.expected) return 0;
    return (this.matchedCount / this.auditMeta.expected) * 100;
  }

  exportToCSV(): void {
    const headers = [
      'RFID Tag ID',
      'Product',
      'Carton No',
      'SKU',
      'Location',
      'Qty Expected',
      'Qty Scanned',
      'Status'
    ];
    const csvContent = [
      headers.join(','),
      ...this.cartons.map(c =>
        [
          c.rfidTagId,
          `"${c.productName}"`,
          c.cartonNo,
          c.sku,
          `"${c.location}"`,
          c.qtyExpected,
          c.qtyScanned,
          c.status
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rfid-inventory-audit.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
