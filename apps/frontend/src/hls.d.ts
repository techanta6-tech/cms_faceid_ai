// Type declarations for hls.js loaded via CDN (window.Hls global)
// This file tells TypeScript about the Hls class so the DashboardPage compiles cleanly.

declare class Hls {
  static readonly Events: {
    MANIFEST_PARSED: string;
    ERROR: string;
    [key: string]: string;
  };
  static isSupported(): boolean;

  constructor(config?: {
    enableWorker?: boolean;
    lowLatencyMode?: boolean;
    backBufferLength?: number;
    maxBufferLength?: number;
    maxMaxBufferLength?: number;
    [key: string]: any;
  });

  loadSource(url: string): void;
  attachMedia(media: HTMLVideoElement): void;
  destroy(): void;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
}

declare module 'hls.js' {
  export = Hls;
}
