import { Injectable } from '@angular/core';

export type IdDocType = 'emirates_id' | 'passport' | 'visa' | 'labour_card';

export interface IdentityOverlay {
  emiratesIdExpiry?: string;
  passportExpiry?: string;
  visaNumber?: string;
  visaExpiry?: string;
  labourCardExpiry?: string;
}

export interface ProjectSite {
  id: string;
  name: string;
  location: string;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  sites: ProjectSite[];
}

export interface SiteAllocation {
  employeeId: string;
  empCode: string;
  projectId: string;
  siteId: string;
  startDate: string;
}

export interface SiteTransfer {
  id: string;
  employeeId: string;
  fromProjectId: string;
  fromSiteId: string;
  toProjectId: string;
  toSiteId: string;
  effectiveDate: string;
  reason: string;
  transferredBy: string;
}

const ID_KEY = 'nablus_employee_identity';
const ALLOC_KEY = 'nablus_employee_site_allocations';
const TRANSFER_KEY = 'nablus_employee_site_transfers';

const PROJECTS: Project[] = [
  {
    id: 'prj-szr',
    name: 'Sheikh Zayed Road Widening',
    code: 'SZR-W',
    client: 'RTA Dubai',
    sites: [
      { id: 'site-szr-3', name: 'SZR Package 3', location: 'Interchange 3–4, Dubai', projectId: 'prj-szr' },
      { id: 'site-szr-5', name: 'SZR Package 5', location: 'Al Quoz corridor, Dubai', projectId: 'prj-szr' },
    ],
  },
  {
    id: 'prj-alain',
    name: 'Al Ain Road Dual Carriageway',
    code: 'AAN-DC',
    client: 'Abu Dhabi DMT',
    sites: [
      { id: 'site-alain-12', name: 'Al Ain KM 12', location: 'Al Ain Road, Dubai', projectId: 'prj-alain' },
      { id: 'site-alain-18', name: 'Al Ain KM 18 Yard', location: 'Hatta link, Dubai', projectId: 'prj-alain' },
    ],
  },
  {
    id: 'prj-dip',
    name: 'DIP Internal Roads Package',
    code: 'DIP-IR',
    client: 'Trakhees',
    sites: [
      { id: 'site-dip-4', name: 'DIP Sector 4', location: 'Dubai Investment Park', projectId: 'prj-dip' },
    ],
  },
  {
    id: 'prj-jebel',
    name: 'Jebel Ali Port Access Roads',
    code: 'JAF-AR',
    client: 'DP World',
    sites: [
      { id: 'site-jafza', name: 'JAFZA Gate 2', location: 'Jebel Ali Free Zone', projectId: 'prj-jebel' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class EmployeeWorkforceService {
  getProjects(): Project[] {
    return PROJECTS;
  }

  getProject(id: string): Project | null {
    return PROJECTS.find((p) => p.id === id) || null;
  }

  getSite(id: string): ProjectSite | null {
    for (const project of PROJECTS) {
      const site = project.sites.find((s) => s.id === id);
      if (site) return site;
    }
    return null;
  }

  getSitesForProject(projectId: string): ProjectSite[] {
    return this.getProject(projectId)?.sites || [];
  }

  getIdentity(employeeId: string, empCode: string, employee: any): IdentityOverlay {
    this.ensureSeed();
    const map = this.readMap<IdentityOverlay>(ID_KEY);
    const saved = map[employeeId] || map[empCode] || {};
    return {
      emiratesIdExpiry: saved.emiratesIdExpiry || '2027-03-14',
      passportExpiry: saved.passportExpiry || '2028-11-02',
      visaNumber: saved.visaNumber || employee?.visa_number || '',
      visaExpiry: saved.visaExpiry || employee?.visa_expiry || '2026-10-20',
      labourCardExpiry: saved.labourCardExpiry || '2026-12-01',
    };
  }

  saveIdentity(employeeId: string, overlay: IdentityOverlay): void {
    const map = this.readMap<IdentityOverlay>(ID_KEY);
    map[employeeId] = { ...(map[employeeId] || {}), ...overlay };
    localStorage.setItem(ID_KEY, JSON.stringify(map));
  }

  getAllocation(employeeId: string, empCode: string): SiteAllocation | null {
    this.ensureSeed();
    const list = this.readList<SiteAllocation>(ALLOC_KEY);
    return list.find((a) => a.employeeId === employeeId || a.empCode === empCode || a.employeeId === empCode) || null;
  }

  setAllocation(allocation: SiteAllocation): void {
    const list = this.readList<SiteAllocation>(ALLOC_KEY).filter(
      (a) => a.employeeId !== allocation.employeeId && a.empCode !== allocation.empCode,
    );
    list.push(allocation);
    localStorage.setItem(ALLOC_KEY, JSON.stringify(list));
  }

  getTransfers(employeeId: string, empCode: string): SiteTransfer[] {
    this.ensureSeed();
    return this.readList<SiteTransfer>(TRANSFER_KEY)
      .filter((t) => t.employeeId === employeeId || t.employeeId === empCode)
      .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1));
  }

  transferEmployee(input: {
    employeeId: string;
    empCode: string;
    toProjectId: string;
    toSiteId: string;
    effectiveDate: string;
    reason: string;
  }): SiteTransfer {
    const current = this.getAllocation(input.employeeId, input.empCode);
    const transfer: SiteTransfer = {
      id: `tr-${Date.now()}`,
      employeeId: input.employeeId,
      fromProjectId: current?.projectId || '',
      fromSiteId: current?.siteId || '',
      toProjectId: input.toProjectId,
      toSiteId: input.toSiteId,
      effectiveDate: input.effectiveDate,
      reason: input.reason.trim(),
      transferredBy: 'Payroll Admin',
    };
    const transfers = this.readList<SiteTransfer>(TRANSFER_KEY);
    transfers.push(transfer);
    localStorage.setItem(TRANSFER_KEY, JSON.stringify(transfers));
    this.setAllocation({
      employeeId: input.employeeId,
      empCode: input.empCode,
      projectId: input.toProjectId,
      siteId: input.toSiteId,
      startDate: input.effectiveDate,
    });
    return transfer;
  }

  private ensureSeed(): void {
    if (!localStorage.getItem(ALLOC_KEY)) {
      const seed: SiteAllocation[] = [
        {
          employeeId: '11001',
          empCode: 'NRC001',
          projectId: 'prj-szr',
          siteId: 'site-szr-3',
          startDate: '2025-11-01',
        },
      ];
      localStorage.setItem(ALLOC_KEY, JSON.stringify(seed));
    }
    if (!localStorage.getItem(TRANSFER_KEY)) {
      const seed: SiteTransfer[] = [
        {
          id: 'tr-seed-1',
          employeeId: '11001',
          fromProjectId: 'prj-dip',
          fromSiteId: 'site-dip-4',
          toProjectId: 'prj-szr',
          toSiteId: 'site-szr-3',
          effectiveDate: '2025-11-01',
          reason: 'Moved to lead SZR Package 3 earthworks',
          transferredBy: 'HR Operations',
        },
      ];
      localStorage.setItem(TRANSFER_KEY, JSON.stringify(seed));
    }
    if (!localStorage.getItem(ID_KEY)) {
      localStorage.setItem(ID_KEY, JSON.stringify({}));
    }
  }

  private readList<T>(key: string): T[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  private readMap<T>(key: string): Record<string, T> {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }
}
