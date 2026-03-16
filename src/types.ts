export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

export interface GenerationSettings {
  aspectRatio: AspectRatio;
  negativePrompt: string;
  enhancePrompt: boolean;
  safetySetting: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  timestamp: number;
  settings: GenerationSettings;
}
