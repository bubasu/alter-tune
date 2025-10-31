import { Component, OnDestroy, EffectRef, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Tuning, Fingering, ArpeggioPattern, TransportState, ScheduledNote } from './models';
import { TuningEditorComponent } from './components/tuning-editor.component';
import { FingeringEditorComponent } from './components/fingering-editor.component';
import { ArpeggioSequencerComponent } from './components/arpeggio-sequencer.component';
import { TransportComponent } from './components/transport.component';
import { FingeringPresetsComponent } from './components/fingering-presets.component';
import { AudioEngineService } from './audio-engine.service';
import { TheoryService } from './theory.service';

@Component({
  selector: 'at-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, TuningEditorComponent, FingeringEditorComponent, FingeringPresetsComponent, ArpeggioSequencerComponent, TransportComponent],
  template: `
  <div class="wrap">
    <h2>Alter Tune</h2>
    <p>Explore alternative guitar tunings!</p>
    <div class="cols">
      <div class="col">
        <at-tuning-editor [tuning]="tuning()" (tuningChange)="tuning.set($event)"></at-tuning-editor>
        <at-fingering-editor [tuningStrings]="tuning().strings" [fingering]="fingering()" (fingeringChange)="fingering.set($event)"></at-fingering-editor>
        <at-fingering-presets [fingering]="fingering()" [stringsCount]="tuning().strings.length" [tuningName]="tuning().name" (select)="fingering.set($event)"></at-fingering-presets>
      </div>
      <div class="col">
        <at-arpeggio-sequencer [stringsCount]="tuning().strings.length" [pattern]="pattern" (patternChange)="pattern.set($event)"></at-arpeggio-sequencer>
        <at-transport [transport]="transport" (transportChange)="onTransport($event)"></at-transport>
      </div>
    </div>
    <p class="hint">Hinweis: Klicke im Sequencer auf Zellen, um Steps pro Saite zu aktivieren. Play startet die Audio‑Engine (Web Audio API). SVG wird für die Visualisierung verwendet.</p>
  </div>
  `,
  styles: [`
    .wrap { padding: 12px; display: block; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
    .col { display: flex; flex-direction: column; gap: 12px; }
    .hint { color: #666; font-size: 12px; margin-top: 12px; }

    /* Mobile: stack panels in a single column */
    @media (max-width: 800px) {
      .cols { grid-template-columns: 1fr; }
      .wrap { padding: 10px; }
    }
  `]
})
export class WorkspaceComponent implements OnDestroy {
  tuning = signal<Tuning>({ name: 'Standard (EADGBE)', strings: [
    {stringIndex:0, pitch:{note:'E',octave:2}},
    {stringIndex:1, pitch:{note:'A',octave:2}},
    {stringIndex:2, pitch:{note:'D',octave:3}},
    {stringIndex:3, pitch:{note:'G',octave:3}},
    {stringIndex:4, pitch:{note:'B',octave:3}},
    {stringIndex:5, pitch:{note:'E',octave:4}},
  ]});
  fingering = signal<Fingering>({ frets: [0,0,0,0,0,0] });
  pattern = signal<ArpeggioPattern>({ stepsPerBar: 16, bars: 1, events: [
    {step:0, strings:[5]},
    {step:2, strings:[4]},
    {step:4, strings:[3]},
    {step:6, strings:[2]},
    {step:8, strings:[1]},
    {step:10, strings:[0]},
    {step:12, strings:[1]},
    {step:14, strings:[2]},
  ]});
  transport = signal<TransportState>({ bpm: 100, playing: false });

  private startedAt = 0; // AudioContext time when playback started
  private dispose?: EffectRef;

  constructor(private audio: AudioEngineService, private theory: TheoryService) {
    // React to play/stop
    this.dispose = effect(() => {
      const t = this.transport();
      if (t.playing) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  onTransport(t: TransportState) { this.transport.set(t); }

  private start() {
    this.audio.resume().then(() => {
      this.startedAt = this.audio.currentTime;
      this.audio.startScheduler((t0, t1) => this.computeWindow(t0, t1));
    });
  }
  private stop() {
    this.audio.stopScheduler();
  }

  private computeWindow(t0: number, t1: number): ScheduledNote[] {
    const t = this.transport();
    const p = this.pattern();

    // Guards against invalid/edge values
    if (!isFinite(t.bpm) || t.bpm <= 0) return [];
    if (!isFinite(p.stepsPerBar) || p.stepsPerBar <= 0) return [];
    if (!isFinite(p.bars) || p.bars <= 0) return [];
    if (!p.events || p.events.length === 0) return [];

    const stepDur = (60 / t.bpm) * (4 / p.stepsPerBar); // 4 beats per bar
    if (!isFinite(stepDur) || stepDur <= 0) return [];

    const totalSteps = p.stepsPerBar * p.bars;
    const patternDur = stepDur * totalSteps;
    if (!isFinite(patternDur) || patternDur <= 0) return [];

    const strings = this.tuning().strings;
    const frets = this.fingering().frets;

    const events: ScheduledNote[] = [];
    const MAX_EVENTS_PER_TICK = 4096; // hard cap to prevent runaway scheduling

    // Determine which pattern repetitions intersect [t0, t1)
    const relStart = t0 - this.startedAt;
    let kStart = Math.floor(relStart / patternDur);
    if (!isFinite(kStart)) kStart = 0;

    // Iterate pattern instances until baseStart >= t1
    for (let k = kStart; ; k++) {
      const baseStart = this.startedAt + k * patternDur;
      if (baseStart >= t1) break;

      // Emit events that fall into [t0, t1)
      for (const ev of p.events) {
        const evTime = baseStart + ev.step * stepDur;
        if (evTime >= t0 && evTime < t1) {
          const spreadMs = ev.strumMs ?? 8; // small spread per string
          for (let i = 0; i < ev.strings.length; i++) {
            const sIdx = ev.strings[i];
            if (sIdx < 0 || sIdx >= strings.length) continue;
            const fret = frets[sIdx] ?? 0;
            if (fret < 0) continue; // muted
            const open = strings[sIdx]?.pitch;
            if (!open) continue;
            const freq = this.theory.transposedFreq(open, fret);
            const time = evTime + (i * spreadMs) / 1000;
            const lengthSec = Math.max(0.01, (ev.lengthSteps ?? 2) * stepDur * 0.95);
            events.push({ time, freq, velocity: ev.velocity ?? 0.8, lengthSec });
            if (events.length >= MAX_EVENTS_PER_TICK) return events;
          }
        }
      }

      // advance to next repetition automatically via for-loop
    }

    return events;
  }

  ngOnDestroy(): void {
    this.dispose?.destroy();
    this.stop();
  }
}
