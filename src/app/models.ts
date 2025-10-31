// Domain models for AlterTune
export type NoteName = 'C'|'C#'|'Db'|'D'|'D#'|'Eb'|'E'|'F'|'F#'|'Gb'|'G'|'G#'|'Ab'|'A'|'A#'|'Bb'|'B';

export interface Pitch {
  note: NoteName;
  octave: number; // e.g., 2..7 for guitar range
  cents?: number; // microtuning offset (optional)
}

export interface StringTuning {
  stringIndex: number; // 0 = lowest string
  pitch: Pitch;        // open string pitch
}

export interface Tuning {
  name?: string;
  strings: StringTuning[]; // arbitrary count
}

export interface Fingering {
  name?: string;
  frets: number[]; // index = stringIndex; -1=mute, 0=open, 1..N=fret
}

export interface ArpEvent {
  step: number;        // step index in pattern
  strings: number[];   // which string indices to pluck
  velocity?: number;   // 0..1
  lengthSteps?: number;// sustain length in steps
  strumMs?: number;    // optional spread within the event
}

export interface ArpeggioPattern {
  stepsPerBar: number; // e.g., 16
  bars: number;        // number of bars
  events: ArpEvent[];
}

export interface TransportState {
  bpm: number;
  swing?: number;     // 0..1
  humanizeMs?: number;// random small offset
  playing: boolean;
}

export interface ScheduledNote {
  time: number; // AudioContext time in seconds
  freq: number;
  velocity?: number;
  lengthSec?: number;
}
