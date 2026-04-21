declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

declare type SpeechRecognition = any;

declare module 'web-speech-api' {
  export const SpeechRecognition: any;
}

export {};
