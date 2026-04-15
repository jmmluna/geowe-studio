import { Directive, ElementRef, AfterViewInit, Input } from '@angular/core';
import { EventBusService } from '../event-bus.service';

@Directive({
  selector: '[pluginContainer]',
  standalone: true
})
export class PluginContainerDirective implements AfterViewInit {
  @Input('pluginContainer') panelId!: string;

  constructor(
    private el: ElementRef,
    private eventBus: EventBusService
  ) {}

  ngAfterViewInit() {
    // Notificar al núcleo que el contenedor (sidebar, panel o modal) está listo
    this.eventBus.emit({
      type: 'ui:pluginContainerReady',
      payload: {
        id: this.panelId,
        el: this.el.nativeElement
      }
    });
  }
}
