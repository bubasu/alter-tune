import { Injectable } from '@angular/core';
import { NoteName, Pitch } from './models';

const NOTE_TO_SEMITONE: Record<NoteName, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

@Injectable({ providedIn: 'root' })
export class TheoryService {
  a4 = 440;

  pitchToMidi(p: Pitch): number {
    const semitone = NOTE_TO_SEMITONE[p.note];
    // MIDI: C-1 = 0, C4 = 60, A4 = 69
    const midi = (p.octave + 1) * 12 + semitone;
    return midi;
  }

  midiToFreq(midi: number, a4 = this.a4): number {
    return a4 * Math.pow(2, (midi - 69) / 12);
  }

  pitchToFreq(p: Pitch): number {
    const midi = this.pitchToMidi(p);
    let freq = this.midiToFreq(midi);
    if (p.cents && p.cents !== 0) {
      freq *= Math.pow(2, p.cents / 1200);
    }
    return freq;
  }

  // Add fret offset in semitones to a base pitch (open string)
  transposedFreq(open: Pitch, fret: number): number {
    const openMidi = this.pitchToMidi(open);
    return this.midiToFreq(openMidi + fret);
  }
}
