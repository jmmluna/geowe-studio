import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventBusService } from '../../event-bus.service';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css']
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  public isVisible = true;
  public logoUrl = 'logo-geowe.png';
  public statusText = 'Iniciando sistema...';

  constructor(
    private eventBus: EventBusService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.eventBus.on('app:loadingStart', () => {
      this.isVisible = true;
      this.cdr.detectChanges();
    });

    this.eventBus.on('app:loadingEnd', () => {
      this.isVisible = false;
      this.cdr.detectChanges();
    });

    this.eventBus.on('ui:statusChanged', (status: string) => {
      this.statusText = status;
      this.cdr.detectChanges();
    });

    this.eventBus.on('app:configApplied', (manifest: any) => {
      if (manifest && manifest.logoRaw) {
        this.logoUrl = manifest.logoRaw;
        // Solo para refrescar si estamos mostrando el splash actualmente
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    // Si fuera necesario limpiar escuchas, se haría aquí. EventBus actual no tiene tipado off() claro a menos que se use RxJS
  }
}
