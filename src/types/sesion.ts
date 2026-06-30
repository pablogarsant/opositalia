export interface Flashcard {
  frente: string;
  dorso: string;
  bloque?: string;
}

export interface PreguntaExamen {
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion?: string;
}

export interface ContenidoSesion {
  flashcards: Flashcard[];
  conceptosClave: string[];
  mapaMental: string;
  mnemotecnias: string[];
  preguntas: PreguntaExamen[];
}
