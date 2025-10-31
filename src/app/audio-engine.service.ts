import { Injectable } from '@angular/core';
import { ScheduledNote } from './models';

@Injectable({ providedIn: 'root' })
export class AudioEngineService {
  private ctx: AudioContext | null = null;
  private lookahead = 0.025; // 25ms
  private scheduleAheadTime = 0.1; // 100ms
  private timerId: any;
  private lastScheduledTime: number | null = null; // marks end of last scheduling window

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  get currentTime(): number {
    return this.ensureContext().currentTime;
  }

  resume(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state !== 'running') {
      return ctx.resume().then(() => {});
    }
    return Promise.resolve();
  }

  stopScheduler(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.lastScheduledTime = null;
  }

  startScheduler(getEventsInWindow: (t0: number, t1: number) => ScheduledNote[]): void {
    const ctx = this.ensureContext();
    this.stopScheduler();
    // Initialize window start at current time to avoid back-scheduling
    this.lastScheduledTime = ctx.currentTime;
    this.timerId = setInterval(() => {
      const now = ctx.currentTime;
      const t0 = this.lastScheduledTime ?? now;
      const t1 = now + this.scheduleAheadTime;
      if (t1 > t0) {
        const events = getEventsInWindow(t0, t1);
        for (const ev of events) {
          this.triggerPluck(ev.time, ev.freq, ev.velocity ?? 0.8, ev.lengthSec ?? 0.2);
        }
        this.lastScheduledTime = t1;
      }
    }, this.lookahead * 1000);
  }

  triggerPluck(time: number, freq: number, vel: number, lengthSec: number) {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(12000, freq * 4), time);
    filter.Q.value = 0.8;

    const g = gain.gain;
    const floor = 0.0001;
    g.setValueAtTime(floor, time);
    g.exponentialRampToValueAtTime(Math.max(floor, vel), time + 0.005);
    g.exponentialRampToValueAtTime(floor, time + lengthSec);

    // Connect graph
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Ensure nodes are disconnected for GC after sound ends
    osc.onended = () => {
      try { osc.disconnect(); } catch {}
      try { filter.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
    };

    osc.start(time);
    osc.stop(time + lengthSec + 0.05);
  }
}
