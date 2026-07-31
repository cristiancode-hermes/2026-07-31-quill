import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { Location } from '../../models/models';

@Component({
  selector: 'app-location-node',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div>
      <div class="tree-item" [style.paddingLeft.px]="12 + depth() * 20" (click)="navigate.emit(location().id)">
        <span>{{ icon() }}</span>
        <span style="flex: 1; font-weight: 500;">{{ location().name }}</span>
        <span class="badge badge-accent">{{ location().type }}</span>
        @if (location().population) {
          <span class="mono muted">{{ location().population | number }}</span>
        }
      </div>
      @if (location().children?.length) {
        <div>
          @for (child of location().children!; track child.id) {
            <app-location-node [location]="child" [depth]="depth() + 1" [storyId]="storyId()" (navigate)="navigate.emit($event)" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tree-item { border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent); }
  `]
})
export class LocationNode {
  location = input.required<Location>();
  depth = input(0);
  storyId = input('');
  navigate = output<string>();

  icon() {
    const icons: Record<string, string> = {
      world: '🌍', continent: '🌎', realm: '🏰', city: '🏙️', town: '🏘️',
      building: '🏛️', room: '🚪', landmark: '🗿', region: '⛰️',
    };
    return icons[this.location().type] ?? '📍';
  }
}
