import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Fingering } from '../models';
import { PresetService, FingeringPreset } from '../preset.service';

@Component({
  selector: 'at-fingering-presets',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="panel">
    <h3>Fingering Presets</h3>
    <div class="controls">
      <input type="text" [value]="name" placeholder="Preset name" (input)="name = $any($event.target).value" />
      <button (click)="save()">Save</button>
    </div>
    <div class="list">
      <button *ngFor="let p of presets(); trackBy: track" (click)="apply(p)" title="{{p.tuningName || ''}} ({{p.stringsCount}} strings)">{{p.name}}</button>
    </div>
  </div>`,
  styles: [`.panel{border:1px solid #ddd;padding:12px;border-radius:8px}.controls{display:flex;gap:8px;align-items:center;margin-bottom:8px}.controls input{flex:1}.list{display:flex;gap:6px;flex-wrap:wrap}`]
})
export class FingeringPresetsComponent implements OnInit {
  @Input({required:true}) fingering!: Fingering;
  @Input({required:true}) stringsCount!: number;
  @Input() tuningName?: string;
  @Output() select = new EventEmitter<Fingering>();

  name = '';
  presets = signal<FingeringPreset[]>([]);
  track = (_: number, p: FingeringPreset) => p.id;

  constructor(private presetsSvc: PresetService) {}

  async ngOnInit() {
    await this.refresh();
  }

  private async refresh() {
    const all = await this.presetsSvc.list();
    const same = all.filter(p => p.stringsCount === this.stringsCount);
    const other = all.filter(p => p.stringsCount !== this.stringsCount);
    this.presets.set([...same, ...other]);
  }

  async save() {
    const name = (this.name || '').trim() || `Preset ${new Date().toLocaleString()}`;
    await this.presetsSvc.save(name, this.fingering, this.stringsCount, this.tuningName);
    this.name = '';
    await this.refresh();
  }

  apply(p: FingeringPreset) {
    const frets = this.mapFrets(p.fingering.frets, this.stringsCount);
    this.select.emit({ ...p.fingering, frets });
  }

  private mapFrets(src: number[], targetCount: number): number[] {
    if (src.length === targetCount) return src.slice();
    if (src.length > targetCount) return src.slice(src.length - targetCount);
    return [...Array(targetCount - src.length).fill(0), ...src];
  }
}
