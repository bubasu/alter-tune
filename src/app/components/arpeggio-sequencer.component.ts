import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArpeggioPattern } from '../models';

@Component({
  selector: 'at-arpeggio-sequencer',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="panel">
    <h3>Arpeggio Sequencer</h3>
    <div class="controls">
      <label>Steps/Bar: <input type="number" [value]="pattern().stepsPerBar" min="2" max="64" (input)="setSteps($any($event.target).valueAsNumber)"></label>
      <label>Bars: <input type="number" [value]="pattern().bars" min="1" max="16" (input)="setBars($any($event.target).valueAsNumber)"></label>
      <button (click)="clear()">Clear</button>
    </div>

    <div class="grid" [style.gridTemplateColumns]="gridCols()">
      <div class="cell head" *ngFor="let c of cols(); index as ci; trackBy: trackByIndex">{{ci+1}}</div>
      <ng-container *ngFor="let r of rows(); trackBy: trackByIndex">
        <div class="row-label">S{{r+1}}</div>
        <div class="cell" *ngFor="let c of cols(); index as ci; trackBy: trackByIndex"
             [class.active]="hasEvent(ci, r)"
             (click)="toggle(ci, r)"></div>
      </ng-container>
    </div>
  </div>
  `,
  styles: [`
    .panel { border:1px solid #ddd; padding:12px; border-radius:8px; }
    .controls { display:flex; gap:12px; align-items:center; margin-bottom:8px; }
    .grid { display:grid; gap:4px; align-items:center; }
    .row-label { font-size: 11px; color:#555; }
    .cell { width: 18px; height: 18px; border:1px solid #ccc; cursor:pointer; background:#fff; }
    .head { font-size:10px; text-align:center; border:none; }
    .cell.active { background:#4caf50; border-color:#3b8d3f; }
  `]
})
export class ArpeggioSequencerComponent {
  @Input({required:true}) pattern = signal<ArpeggioPattern>({ stepsPerBar: 16, bars: 1, events: [] });
  @Input({required:true}) stringsCount = 6;
  @Output() patternChange = new EventEmitter<ArpeggioPattern>();

  private _rows: any[] = [];
  private _cols: any[] = [];

  trackByIndex = (i: number) => i;

  rows = () => {
    const n = this.stringsCount;
    if (this._rows.length !== n || typeof this._rows[0] !== 'number') {
      this._rows = Array.from({ length: n }, (_, k) => n - 1 - k);
    }
    return this._rows;
  };

  totalSteps = () => this.pattern().stepsPerBar * this.pattern().bars;

  cols = () => {
    const need = this.totalSteps();
    if (this._cols.length !== need) this._cols = Array.from({ length: need });
    return this._cols;
  };

  gridCols = () => `repeat(${this.totalSteps()+1}, 20px)`; // +1 for row label

  hasEvent(step: number, stringIndex: number): boolean {
    return this.pattern().events.some(ev => ev.step === step && ev.strings.includes(stringIndex));
  }

  toggle(step: number, stringIndex: number) {
    const p = this.pattern();
    const idx = p.events.findIndex(ev => ev.step === step && ev.strings.includes(stringIndex));
    let events = p.events.slice();
    if (idx >= 0) {
      // remove string from event or remove event if empty
      const ev = { ...events[idx], strings: events[idx].strings.filter(s => s !== stringIndex) };
      if (ev.strings.length === 0) {
        events.splice(idx, 1);
      } else {
        events[idx] = ev;
      }
    } else {
      // add new or merge
      const existingAtStep = events.findIndex(e => e.step === step);
      if (existingAtStep >= 0) {
        const ev = { ...events[existingAtStep] };
        ev.strings = Array.from(new Set([ ...ev.strings, stringIndex ]));
        events[existingAtStep] = ev;
      } else {
        events = [ ...events, { step, strings: [stringIndex], velocity: 0.8, lengthSteps: 2 } ];
      }
    }
    this.emit({ ...p, events });
  }

  setSteps(steps: number) {
    const s = Math.max(2, Math.min(64, Math.round(steps || 16)));
    const totalNew = s * this.pattern().bars;
    const events = this.pattern().events.filter(e => e.step < totalNew);
    this._cols = []; // invalidate cache
    this.emit({ ...this.pattern(), stepsPerBar: s, events });
  }

  setBars(bars: number) {
    const b = Math.max(1, Math.min(16, Math.round(bars || 1)));
    const totalNew = b * this.pattern().stepsPerBar;
    const events = this.pattern().events.filter(e => e.step < totalNew);
    this._cols = []; // invalidate cache
    this.emit({ ...this.pattern(), bars: b, events });
  }

  clear() {
    this.emit({ ...this.pattern(), events: [] });
  }

  private emit(p: ArpeggioPattern) {
    this.pattern.set(p);
    this.patternChange.emit(p);
  }
}
