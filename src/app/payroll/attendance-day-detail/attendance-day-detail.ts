import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DemoDataService } from '../../core/demo/demo-data.service';

@Component({
  selector: 'app-attendance-day-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './attendance-day-detail.html',
  styleUrls: ['./attendance-day-detail.scss']
})
export class AttendanceDayDetail implements OnInit, OnDestroy {
  employeeName = '';
  employeeId = '';
  designation = '';
  dayDate = '';
  dayDetailTrail: any[] = [];
  dayDetailSelectedIndex = 0;
  dayDetailLoginTime = '';
  dayDetailLogoutTime = '';

  private mapInstance: any = null;
  private mapMarkers: any[] = [];
  private mapInfoWindows: any[] = [];
  private readonly googleMapsApiKey = 'AIzaSyBvjCNDyOP6Fl6Ls0z48MLE0CnlpTkBUJ8';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demo: DemoDataService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.employeeId = params.get('employeeId') || 'NRC001';
      this.employeeName = params.get('name') || 'Employee';
      this.designation = params.get('designation') || 'Staff';
      this.dayDate = params.get('date') || '';
      if (!this.dayDate) {
        this.router.navigate(['/payroll/attendance']);
        return;
      }
      this.loadTrail();
      setTimeout(() => this.initDayDetailMap(), 200);
    });
  }

  ngOnDestroy(): void {
    this.destroyDayDetailMap();
  }

  private loadTrail(): void {
    this.dayDetailTrail = this.demo.dayLocationTrail(this.employeeId, this.dayDate);
    this.dayDetailSelectedIndex = 0;
    this.dayDetailLoginTime =
      this.dayDetailTrail.find((p) => p.eventType === 'login')?.time ||
      this.dayDetailTrail[0]?.time ||
      '';
    this.dayDetailLogoutTime =
      this.dayDetailTrail.find((p) => p.eventType === 'logout')?.time ||
      this.dayDetailTrail[this.dayDetailTrail.length - 1]?.time ||
      '';
  }

  formatDayDetailDate(dateKey: string): string {
    if (!dateKey) return '';
    try {
      const d = new Date(dateKey + 'T00:00:00');
      return d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateKey;
    }
  }

  selectTrailPoint(index: number): void {
    this.dayDetailSelectedIndex = index;
    const point = this.dayDetailTrail[index];
    if (!this.mapInstance || !point) return;
    this.mapInstance.panTo({ lat: point.lat, lng: point.lng });
    this.mapInstance.setZoom(15);
    const marker = this.mapMarkers[index];
    if (marker) {
      const info = this.mapInfoWindows?.[index];
      this.mapInfoWindows?.forEach((iw: any) => iw?.close());
      info?.open({ map: this.mapInstance, anchor: marker });
    }
  }

  goBack(): void {
    this.router.navigate(['/payroll/attendance']);
  }

  private async ensureGoogleMapsLoaded(): Promise<any> {
    const w = window as any;
    if (w.google?.maps) return w.google.maps;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-google-maps="attendance"]'
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        if (w.google?.maps) resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}`;
      s.async = true;
      s.defer = true;
      s.setAttribute('data-google-maps', 'attendance');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(s);
    });

    return w.google.maps;
  }

  private async initDayDetailMap(): Promise<void> {
    this.destroyDayDetailMap();
    const el = document.getElementById('attendance-day-map');
    if (!el || !this.dayDetailTrail.length) return;

    try {
      const maps = await this.ensureGoogleMapsLoaded();
      const first = this.dayDetailTrail[0];
      this.mapInstance = new maps.Map(el, {
        center: { lat: first.lat, lng: first.lng },
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      this.mapMarkers = [];
      this.mapInfoWindows = [];
      const path: any[] = [];

      this.dayDetailTrail.forEach((p: any, i: number) => {
        const position = { lat: p.lat, lng: p.lng };
        path.push(position);
        // Plain pin only — no IN/OUT/number labels on the map
        const marker = new maps.Marker({
          position,
          map: this.mapInstance,
          title: `${p.time} — ${p.location}`,
        });
        const isLogin = p.eventType === 'login';
        const isLogout = p.eventType === 'logout';
        const eventLabel = isLogin ? 'Logged In' : isLogout ? 'Logged Out' : 'Check-in';
        const info = new maps.InfoWindow({
          content: `<div style="min-width:180px"><strong>${eventLabel} · ${p.time}</strong><br>${p.location}<br><span style="color:#6b7280">${p.activity}</span></div>`,
        });
        marker.addListener('click', () => {
          this.dayDetailSelectedIndex = i;
          this.mapInfoWindows.forEach((iw: any) => iw.close());
          info.open({ map: this.mapInstance, anchor: marker });
        });
        this.mapMarkers.push(marker);
        this.mapInfoWindows.push(info);
      });

      const bounds = new maps.LatLngBounds();
      path.forEach((pos) => bounds.extend(pos));
      this.mapInstance.fitBounds(bounds, 48);
      setTimeout(() => {
        maps.event.trigger(this.mapInstance, 'resize');
        this.mapInstance.fitBounds(bounds, 48);
      }, 150);
    } catch (err) {
      console.error('Google Maps init failed', err);
    }
  }

  private destroyDayDetailMap(): void {
    this.mapInfoWindows?.forEach((iw: any) => {
      try {
        iw.close();
      } catch {}
    });
    this.mapMarkers?.forEach((m: any) => {
      try {
        m.setMap(null);
      } catch {}
    });
    this.mapInstance = null;
    this.mapMarkers = [];
    this.mapInfoWindows = [];
  }
}
