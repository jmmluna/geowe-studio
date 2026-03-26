import { Injectable } from '@angular/core';
import { Subject, Subscription, filter } from 'rxjs';

export interface GeoEvent {
  type: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private subject$ = new Subject<GeoEvent>();

  emit(event: GeoEvent) {
    this.subject$.next(event);
  }

  on(type: string, action: (payload: any) => void): Subscription {
    return this.subject$.pipe(
      filter((e: GeoEvent) => e.type === type)
    ).subscribe(e => action(e.payload));
  }
}
