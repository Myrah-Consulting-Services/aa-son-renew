import { Injectable } from '@angular/core';

export interface Camp {
  id: string;
  name: string;
  location: string;
  capacity: number;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CampAssignment {
  id: string;
  campId: string;
  employeeId: string;
  empCode: string;
  employeeName: string;
  designation: string;
  assignedAt: string;
}

const CAMPS_KEY = 'nablus_camps';
const ASSIGN_KEY = 'nablus_camp_assignments';

@Injectable({ providedIn: 'root' })
export class CampService {
  private ensureSeed(): void {
    if (!localStorage.getItem(CAMPS_KEY)) {
      const seed: Camp[] = [
        {
          id: 'camp-001',
          name: 'Al Quoz Labour Camp',
          location: 'Al Quoz Industrial Area, Dubai',
          capacity: 48,
          description: 'Main site workforce accommodation',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'camp-002',
          name: 'Jebel Ali Camp A',
          location: 'JAFZA, Dubai',
          capacity: 36,
          description: 'Plant & machinery crew camp',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'camp-003',
          name: 'DIP Site Camp',
          location: 'Dubai Investment Park',
          capacity: 24,
          description: 'Road works temporary camp',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(CAMPS_KEY, JSON.stringify(seed));
    }
    if (!localStorage.getItem(ASSIGN_KEY)) {
      localStorage.setItem(ASSIGN_KEY, JSON.stringify([]));
    }
  }

  getCamps(): Camp[] {
    this.ensureSeed();
    try {
      return JSON.parse(localStorage.getItem(CAMPS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  getCamp(id: string): Camp | null {
    return this.getCamps().find((c) => c.id === id) || null;
  }

  saveCamp(camp: Partial<Camp> & { name: string; capacity: number }): Camp {
    this.ensureSeed();
    const camps = this.getCamps();
    if (camp.id) {
      const idx = camps.findIndex((c) => c.id === camp.id);
      if (idx >= 0) {
        const occupied = this.getOccupied(camp.id);
        if (camp.capacity < occupied) {
          throw new Error(`Capacity cannot be less than current occupancy (${occupied}).`);
        }
        camps[idx] = {
          ...camps[idx],
          name: camp.name,
          location: camp.location || camps[idx].location,
          capacity: Number(camp.capacity),
          description: camp.description ?? camps[idx].description,
          status: camp.status || camps[idx].status,
        };
        localStorage.setItem(CAMPS_KEY, JSON.stringify(camps));
        return camps[idx];
      }
    }
    const created: Camp = {
      id: `camp-${Date.now()}`,
      name: camp.name,
      location: camp.location || '',
      capacity: Number(camp.capacity) || 1,
      description: camp.description || '',
      status: camp.status || 'active',
      createdAt: new Date().toISOString(),
    };
    camps.push(created);
    localStorage.setItem(CAMPS_KEY, JSON.stringify(camps));
    return created;
  }

  deleteCamp(id: string): void {
    const occupied = this.getOccupied(id);
    if (occupied > 0) {
      throw new Error('Remove all employees from this camp before deleting.');
    }
    const camps = this.getCamps().filter((c) => c.id !== id);
    localStorage.setItem(CAMPS_KEY, JSON.stringify(camps));
  }

  getAssignments(): CampAssignment[] {
    this.ensureSeed();
    try {
      return JSON.parse(localStorage.getItem(ASSIGN_KEY) || '[]');
    } catch {
      return [];
    }
  }

  getAssignmentsByCamp(campId: string): CampAssignment[] {
    return this.getAssignments().filter((a) => a.campId === campId);
  }

  getAssignmentByEmployee(employeeId: string): CampAssignment | null {
    const key = String(employeeId);
    return (
      this.getAssignments().find(
        (a) => String(a.employeeId) === key || String(a.empCode) === key
      ) || null
    );
  }

  getOccupied(campId: string): number {
    return this.getAssignmentsByCamp(campId).length;
  }

  getAvailableSlots(campId: string): number {
    const camp = this.getCamp(campId);
    if (!camp) return 0;
    return Math.max(0, camp.capacity - this.getOccupied(campId));
  }

  assignEmployee(input: {
    campId: string;
    employeeId: string;
    empCode: string;
    employeeName: string;
    designation: string;
  }): CampAssignment {
    const camp = this.getCamp(input.campId);
    if (!camp) throw new Error('Camp not found.');
    if (camp.status !== 'active') throw new Error('Camp is inactive.');

    const existing = this.getAssignmentByEmployee(input.employeeId)
      || this.getAssignmentByEmployee(input.empCode);
    if (existing) {
      const other = this.getCamp(existing.campId);
      if (existing.campId === input.campId) {
        throw new Error('Employee is already assigned to this camp.');
      }
      throw new Error(
        `Employee is already in "${other?.name || 'another camp'}". Remove them first before assigning elsewhere.`
      );
    }

    if (this.getAvailableSlots(input.campId) <= 0) {
      throw new Error('Camp is at full capacity.');
    }

    const assignment: CampAssignment = {
      id: `asg-${Date.now()}`,
      campId: input.campId,
      employeeId: String(input.employeeId),
      empCode: input.empCode,
      employeeName: input.employeeName,
      designation: input.designation || 'Staff',
      assignedAt: new Date().toISOString(),
    };
    const all = this.getAssignments();
    all.push(assignment);
    localStorage.setItem(ASSIGN_KEY, JSON.stringify(all));
    return assignment;
  }

  removeEmployee(employeeIdOrCode: string): void {
    const key = String(employeeIdOrCode);
    const all = this.getAssignments().filter(
      (a) => String(a.employeeId) !== key && String(a.empCode) !== key
    );
    localStorage.setItem(ASSIGN_KEY, JSON.stringify(all));
  }

  removeAssignment(assignmentId: string): void {
    const all = this.getAssignments().filter((a) => a.id !== assignmentId);
    localStorage.setItem(ASSIGN_KEY, JSON.stringify(all));
  }
}
