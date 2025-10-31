import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pitch, StringTuning, Tuning } from '../models';

const NOTE_OPTIONS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;

@Component({
  selector: 'at-tuning-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="panel">
    <h3>Tuning</h3>
    <div class="controls">
      <label>
        Strings:
        <input type="number" [value]="tuning.strings.length" min="1" max="12" (input)="onChangeCount($any($event.target).valueAsNumber)">
      </label>
      <button (click)="resetStandard()">Standard (EADGBE)</button>
    </div>
    <svg [attr.viewBox]="'0 0 300 ' + (rowsHeight())" class="fretboard">
      <!-- SVG: iterate using real stringIndex values in inverted display order -->
      <g *ngFor="let r of rows(); trackBy: trackByIndex">
        <line [attr.x1]="10" [attr.x2]="290" [attr.y1]="rowY(r)" [attr.y2]="rowY(r)" stroke="#888" stroke-width="2" />
        <text [attr.x]="15" [attr.y]="rowY(r)-4" font-size="10" fill="#444">{{tuning.strings[r].pitch.note}}{{tuning.strings[r].pitch.octave}}</text>
        <text [attr.x]="270" [attr.y]="rowY(r)-4" font-size="10" fill="#666">S{{r+1}}</text>
      </g>
    </svg>
    <div class="grid">
      <!-- Input list: same inverted order, using real stringIndex r -->
      <div class="row" *ngFor="let r of rows(); trackBy: trackByIndex">
        <select [value]="tuning.strings[r].pitch.note" (change)="onNoteChange(r, $any($event.target).value)">
          <option *ngFor="let n of noteOptions" [value]="n">{{n}}</option>
        </select>
        <input type="number" [value]="tuning.strings[r].pitch.octave" min="0" max="8" (input)="onOctaveChange(r, $any($event.target).valueAsNumber)">
        <span class="label">S{{r+1}}</span>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .panel { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
    .controls { display:flex; gap: 12px; align-items: center; margin-bottom: 8px; }
    .grid { display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; gap: 8px; align-items: center; }
    .fretboard { width: 100%; height: 80px; margin-bottom: 8px; background: #fafafa; }
  `]
})
export class TuningEditorComponent {
  @Input({required: true}) tuning!: Tuning;
  @Output() tuningChange = new EventEmitter<Tuning>();

  noteOptions = [...NOTE_OPTIONS];

  // Inverted Y: highest string at top (n-1), lowest at bottom (0)
  rowY = (i: number) => 10 + (Math.max(0, (this.tuning?.strings?.length ?? 1) - 1 - i)) * 12;
  rowsHeight = () => (this.tuning?.strings?.length ? (this.tuning.strings.length - 1)*12 + 20 : 40);

  // Provide real string indices in inverted display order [n-1, ..., 0]
  rows = () => {
    const n = this.tuning?.strings?.length ?? 0;
    return Array.from({ length: n }, (_, k) => n - 1 - k);
  };
  trackByIndex = (i: number) => i;

  onChangeCount(count: number) {
    const strings: StringTuning[] = Array.from({length: Math.max(1, Math.min(12, count || 1))}, (_, idx) => {
      const existing = this.tuning.strings[idx];
      return existing ?? { stringIndex: idx, pitch: { note: 'E', octave: 2 } as Pitch };
    }).map((st, idx) => ({...st, stringIndex: idx}));
    this.emit({ ...this.tuning, strings });
  }

  onNoteChange(i: number, note: string) {
    const strings = this.tuning.strings.map((st, idx) => idx===i ? ({...st, pitch: {...st.pitch, note: note as any}}) : st);
    this.emit({ ...this.tuning, strings });
  }
  onOctaveChange(i: number, octave: number) {
    const strings = this.tuning.strings.map((st, idx) => idx===i ? ({...st, pitch: {...st.pitch, octave}}) : st);
    this.emit({ ...this.tuning, strings });
  }

  resetStandard() {
    const std: Pitch[] = [
      {note:'E', octave:2}, {note:'A', octave:2}, {note:'D', octave:3},
      {note:'G', octave:3}, {note:'B', octave:3}, {note:'E', octave:4}
    ];
    const strings: StringTuning[] = std.map((p, i) => ({ stringIndex: i, pitch: p }));
    this.emit({ name: 'Standard (EADGBE)', strings });
  }

  private emit(tuning: Tuning) {
    this.tuningChange.emit(tuning);
  }
}
