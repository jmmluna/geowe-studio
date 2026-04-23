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
  private subscriptions = new Map<string, Subscription>();

  emit(event: GeoEvent) {
    this.subject$.next(event);
  }

  on(type: string, action: (payload: any) => void) {
    const key = `${type}:${action.toString()}`;
    const sub = this.subject$.pipe(
      filter((e: GeoEvent) => e.type === type)
    ).subscribe(e => action(e.payload));
    this.subscriptions.set(key, sub);
  }

  off(type: string, action: (payload: any) => void) {
    const key = `${type}:${action.toString()}`;
    const sub = this.subscriptions.get(key);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(key);
    }
  }
}
