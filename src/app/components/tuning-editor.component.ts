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
      <g *ngFor="let st of tuning.strings; index as i">
        <line [attr.x1]="10" [attr.x2]="290" [attr.y1]="rowY(i)" [attr.y2]="rowY(i)" stroke="#888" stroke-width="2" />
        <text [attr.x]="15" [attr.y]="rowY(i)-4" font-size="10" fill="#444">{{st.pitch.note}}{{st.pitch.octave}}</text>
      </g>
    </svg>
    <div class="grid">
      <div class="row" *ngFor="let st of tuning.strings; index as i">
        <select [value]="st.pitch.note" (change)="onNoteChange(i, $any($event.target).value)">
          <option *ngFor="let n of noteOptions" [value]="n">{{n}}</option>
        </select>
        <input type="number" [value]="st.pitch.octave" min="0" max="8" (input)="onOctaveChange(i, $any($event.target).valueAsNumber)">
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
  rowY = (i: number) => 10 + i * 12;
  rowsHeight = () => (this.tuning?.strings?.length ? (this.tuning.strings.length - 1)*12 + 20 : 40);

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
