import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Fingering } from '../models';

@Component({
  selector: 'at-fingering-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="panel">
    <h3>Fingering</h3>
    <div class="controls">
      <label> Max Frets: <input type="number" [value]="maxFrets" min="5" max="24" (input)="maxFrets = $any($event.target).valueAsNumber"></label>
      <button (click)="clear()">Clear</button>
    </div>
    <svg [attr.viewBox]="'0 0 320 ' + (rowsHeight())" class="board">
      <!-- frets as vertical -->
      <g>
        <line *ngFor="let f of fretLines(); index as fi" [attr.x1]="xFret(fi)" [attr.x2]="xFret(fi)" [attr.y1]="5" [attr.y2]="rowsHeight()-5" stroke="#ccc" />
      </g>
      <!-- strings as horizontal -->
      <g *ngFor="let st of tuningStrings; index as i">
        <line [attr.x1]="10" [attr.x2]="310" [attr.y1]="rowY(i)" [attr.y2]="rowY(i)" stroke="#999" stroke-width="2" />
        <circle *ngIf="fretAt(i) >= 0" [attr.cx]="xFret(fretAt(i))" [attr.cy]="rowY(i)" r="5" fill="#333" />
        <text *ngIf="fretAt(i) < 0" [attr.x]="12" [attr.y]="rowY(i)-6" font-size="9" fill="#c33">X</text>
      </g>
    </svg>
    <div class="grid">
      <div class="row" *ngFor="let r of rows(); trackBy: trackByIndex">
        <label>String {{r+1}} Fret:
          <input type="number" [value]="fretAt(r)" (input)="setFret(r, $any($event.target).valueAsNumber)" step="1">
          <small>(-1 mute, 0 open)</small>
        </label>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .panel { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
    .controls { display:flex; gap: 12px; align-items: center; margin-bottom: 8px; }
    .grid { display:flex; flex-direction: column; gap: 6px; }
    .row { display:flex; align-items:center; gap: 8px; }
    .board { width: 100%; height: 120px; background: #fafafa; margin-bottom: 8px; }
  `]
})
export class FingeringEditorComponent {
  @Input({required: true}) fingering!: Fingering;
  @Input({required: true}) tuningStrings: any[] = [];
  @Output() fingeringChange = new EventEmitter<Fingering>();

  maxFrets = 12;

  fretLines = () => Array.from({length: this.maxFrets + 1});
  xFret = (fret: number) => 10 + fret * ((300) / Math.max(1, this.maxFrets));
  rowY = (i: number) => 12 + (Math.max(0, (this.tuningStrings?.length ?? 1) - 1 - i)) * 14;
  rowsHeight = () => (this.tuningStrings?.length ? (this.tuningStrings.length - 1) * 14 + 24 : 40);

  // Provide actual stringIndex values in inverted display order (highest at top, lowest at bottom)
  rows = () => {
    const n = this.tuningStrings?.length ?? 0;
    return Array.from({ length: n }, (_, k) => n - 1 - k);
  };
  trackByIndex = (i: number) => i;

  fretAt = (i: number) => this.fingering?.frets?.[i] ?? 0;

  setFret(i: number, value: number) {
    const frets = (this.fingering?.frets ?? []).slice();
    frets[i] = Math.max(-1, Math.min(24, isFinite(value) ? Math.round(value) : 0));
    this.emit({ ...this.fingering, frets });
  }

  clear() {
    const frets = (this.tuningStrings ?? []).map(() => 0);
    this.emit({ ...this.fingering, frets });
  }

  private emit(f: Fingering) {
    this.fingeringChange.emit(f);
  }
}
