import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventBusService } from '../../event-bus.service';

export interface ProjectionOption {
  code: string;
  name: string;
  desc: string;
  type: 'geographic' | 'projected';
}

@Component({
  selector: 'app-projection-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projection-selector.component.html',
  styleUrls: ['./projection-selector.component.css']
})
export class ProjectionSelectorComponent implements OnInit {
  @Input() filename: string = '';
  @Input() recommendedCode: string = '';
  @Input() probableType: 'geographic' | 'projected' = 'geographic';
  
  @Output() selected = new EventEmitter<string>();

  public searchText: string = '';
  public allOptions: ProjectionOption[] = [
    { code: 'EPSG:4326', name: 'WGS 84 (Geográficas)', desc: 'Sistema Geográfico Global estándar', type: 'geographic' },
    { code: 'EPSG:4258', name: 'ETRS89 (Geográficas)', desc: 'Sistema Geográfico oficial para España', type: 'geographic' },
    { code: 'EPSG:3857', name: 'Web Mercator', desc: 'Sistema estándar para mapas web', type: 'projected' },
    { code: 'EPSG:25830', name: 'ETRS89 / UTM zone 30N', desc: 'España Peninsular (Recomendado)', type: 'projected' },
    { code: 'EPSG:25829', name: 'ETRS89 / UTM zone 29N', desc: 'Galicia y Canarias Occidental', type: 'projected' },
    { code: 'EPSG:25831', name: 'ETRS89 / UTM zone 31N', desc: 'Baleares y Cataluña', type: 'projected' },
    { code: 'EPSG:23030', name: 'ED50 / UTM zone 30N', desc: 'Sistema Antiguo Península', type: 'projected' }
  ];

  public filteredOptions: ProjectionOption[] = [];

  constructor(private eventBus: EventBusService) {}

  ngOnInit() {
    this.filterOptions();
    // Priorizar la recomendada
    this.sortOptions();
  }

  public filterOptions() {
    const search = this.searchText.toLowerCase();
    this.filteredOptions = this.allOptions.filter(opt => 
      opt.code.toLowerCase().includes(search) || 
      opt.name.toLowerCase().includes(search) || 
      opt.desc.toLowerCase().includes(search)
    );
  }

  private sortOptions() {
    // Si tenemos una recomendación, la ponemos arriba
    this.filteredOptions.sort((a, b) => {
      if (a.code === this.recommendedCode) return -1;
      if (b.code === this.recommendedCode) return 1;
      
      // Intentar poner el tipo probable arriba
      if (a.type === this.probableType && b.type !== this.probableType) return -1;
      if (b.type === this.probableType && a.type !== this.probableType) return 1;
      
      return 0;
    });
  }

  public select(code: string) {
    // Emitimos tanto por Output (por si se usa en template) 
    // como por EventBus (para comunicación desacoplada con app.ts)
    this.selected.emit(code);
    this.eventBus.emit({ type: 'ui:projectionSelected', payload: code });
  }
}
