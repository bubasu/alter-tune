import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransportState } from '../models';

@Component({
  selector: 'at-transport',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="panel">
    <h3>Transport</h3>
    <div class="controls">
      <button (click)="toggle()">{{ transport().playing ? 'Stop' : 'Play' }}</button>
      <label>BPM: <input type="number" [value]="transport().bpm" min="30" max="300" (input)="setBpm($any($event.target).valueAsNumber)"></label>
    </div>
  </div>
  `,
  styles: [`
    .panel { border:1px solid #ddd; padding:12px; border-radius:8px; }
    .controls { display:flex; gap:12px; align-items:center; }
  `]
})
export class TransportComponent {
  @Input({required:true}) transport = signal<TransportState>({ bpm: 120, playing: false});
  @Output() transportChange = new EventEmitter<TransportState>();

  toggle() {
    const t = this.transport();
    this.emit({ ...t, playing: !t.playing });
  }

  setBpm(bpm: number) {
    bpm = Math.max(30, Math.min(300, Math.round(bpm || 120)));
    this.emit({ ...this.transport(), bpm });
  }

  private emit(t: TransportState) {
    this.transport.set(t);
    this.transportChange.emit(t);
  }
}
