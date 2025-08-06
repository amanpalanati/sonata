import { GroupBase } from "react-select";

export interface GroupedInstrumentsType {
  label: string;
  value: string;
}

// Groups arranged alphabetically
// Instruments in each group arranged alphabetically
const GroupedInstruments: GroupBase<GroupedInstrumentsType>[] = [
  {
    label: "Brass",
    options: [
      { label: "Baritone Horn", value: "baritone_horn" },
      { label: "Bugle", value: "bugle" },
      { label: "Cornet", value: "cornet" },
      { label: "Euphonium", value: "euphonium" },
      { label: "Flugelhorn", value: "flugelhorn" },
      { label: "French Horn", value: "french_horn" },
      { label: "Sousaphone", value: "sousaphone" },
      { label: "Trombone", value: "trombone" },
      { label: "Trumpet", value: "trumpet" },
      { label: "Tuba", value: "tuba" },
    ],
  },
  {
    label: "Electronic",
    options: [
      { label: "DJ Controller", value: "dj_controller" },
      { label: "Drum Machine", value: "drum_machine" },
      { label: "Electronic Drums", value: "electronic_drums" },
      { label: "MIDI Controller", value: "midi_controller" },
      { label: "Modular Synthesizer", value: "modular_synthesizer" },
      { label: "Sampler", value: "sampler" },
      { label: "Synthesizer", value: "synthesizer" },
      { label: "Theremin", value: "theremin" },
      { label: "Turntables", value: "turntables" },
      { label: "Vocoder", value: "vocoder" },
      { label: "Wavetable Synthesizer", value: "wavetable_synthesizer" },
    ],
  },
  {
    label: "Keyboard",
    options: [
      { label: "Accordion", value: "accordion" },
      { label: "Celesta", value: "celesta" },
      { label: "Clavichord", value: "clavichord" },
      { label: "Harpsichord", value: "harpsichord" },
      { label: "Organ", value: "organ" },
      { label: "Piano", value: "piano" },
      { label: "Rhodes", value: "rhodes" },
    ],
  },
  {
    label: "Percussion",
    options: [
      { label: "Bongo Drums", value: "bongo_drums" },
      { label: "Cajón", value: "cajon" },
      { label: "Castanets", value: "castanets" },
      { label: "Chimes", value: "chimes" },
      { label: "Congas", value: "congas" },
      { label: "Cowbell", value: "cowbell" },
      { label: "Cymbals", value: "cymbals" },
      { label: "Djembe", value: "djembe" },
      { label: "Drum Set", value: "drum_set" },
      { label: "Glockenspiel", value: "glockenspiel" },
      { label: "Maracas", value: "maracas" },
      { label: "Marimba", value: "marimba" },
      { label: "Snare Drum", value: "snare_drum" },
      { label: "Steel Drums", value: "steel_drums" },
      { label: "Tabla", value: "tabla" },
      { label: "Tambourine", value: "tambourine" },
      { label: "Timpani", value: "timpani" },
      { label: "Triangle", value: "triangle" },
      { label: "Vibraphone", value: "vibraphone" },
      { label: "Xylophone", value: "xylophone" },
    ],
  },
  {
    label: "Strings",
    options: [
      { label: "Banjo", value: "banjo" },
      { label: "Bass Guitar", value: "bass_guitar" },
      { label: "Cello", value: "cello" },
      { label: "Double Bass", value: "double_bass" },
      { label: "Fiddle", value: "fiddle" },
      { label: "Guitar (Acoustic)", value: "guitar_acoustic" },
      { label: "Guitar (Electric)", value: "guitar_electric" },
      { label: "Harp", value: "harp" },
      { label: "Mandolin", value: "mandolin" },
      { label: "Ukulele", value: "ukulele" },
      { label: "Viola", value: "viola" },
      { label: "Violin", value: "violin" },
    ],
  },
  {
    label: "Voice",
    options: [
      { label: "Baritone (Voice)", value: "baritone_voice" },
      { label: "Bass (Voice)", value: "bass_voice" },
      { label: "Mezzo-Soprano", value: "mezzo_soprano" },
      { label: "Soprano", value: "soprano" },
      { label: "Tenor", value: "tenor" },
      { label: "Vocal Coaching", value: "vocal_coaching" },
    ],
  },
  {
    label: "Woodwind",
    options: [
      { label: "Alto Flute", value: "alto_flute" },
      { label: "Alto Saxophone", value: "alto_saxophone" },
      { label: "Baritone Saxophone", value: "baritone_saxophone" },
      { label: "Bass Clarinet", value: "bass_clarinet" },
      { label: "Bass Flute", value: "bass_flute" },
      { label: "Bass Oboe", value: "bass_oboe" },
      { label: "Bass Saxophone", value: "bass_saxophone" },
      { label: "Bassoon", value: "bassoon" },
      { label: "Clarinet", value: "clarinet" },
      { label: "Contrabassoon", value: "contrabassoon" },
      { label: "English Horn", value: "english_horn" },
      { label: "Flute", value: "flute" },
      { label: "Oboe", value: "oboe" },
      { label: "Pan Flute", value: "pan_flute" },
      { label: "Piccolo", value: "piccolo" },
      { label: "Recorder", value: "recorder" },
      { label: "Soprano Saxophone", value: "soprano_saxophone" },
      { label: "Tenor Saxophone", value: "tenor_saxophone" },
    ],
  },
];

export default GroupedInstruments;
