// can-deactivate.guard.ts
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}
  

// can-deactivate.guard.ts
import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class CanDeactivateGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(component: CanComponentDeactivate): boolean | Promise<boolean> {
    return component.canDeactivate ? component.canDeactivate() : true;
  }
}