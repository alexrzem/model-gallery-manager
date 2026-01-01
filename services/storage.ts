import { Model, Combination, AppState, ModelType, GenerationSettings } from '../types';

const STORAGE_KEY = 'neurogallery_data_v1';

const DEFAULT_SETTINGS: GenerationSettings = {
  steps: 30,
  cfgScale: 7.0,
  sampler: 'Euler a',
  width: 1024,
  height: 1024,
  negativePrompt: 'blurry, low quality, watermark, text',
};

const SEED_DATA: AppState = {
  models: [
    {
      id: 'm1',
      name: 'Juggernaut XL',
      type: 'Checkpoint',
      version: 'SDXL',
      description: 'High quality photorealistic model.',
      thumbnailUrl: 'https://picsum.photos/id/1/400/400',
      triggerWords: [],
      fileLocation: '/models/sdxl/juggernautXL_v9.safetensors',
      preferredSettings: { steps: 35, cfgScale: 6.0, sampler: 'DPM++ 2M Karras' },
      prompts: [
        {
          id: 'p1',
          text: 'A futuristic city with flying cars, cyberpunk style, neon lights',
          settings: { ...DEFAULT_SETTINGS, steps: 40 },
          imageUrl: 'https://picsum.photos/id/12/400/400',
          createdAt: Date.now(),
        }
      ]
    },
    {
      id: 'm2',
      name: 'DreamShaper 8',
      type: 'Checkpoint',
      version: 'SD v1.5',
      description: 'Versatile artistic model.',
      thumbnailUrl: 'https://picsum.photos/id/28/400/400',
      fileLocation: '/models/sd15/dreamshaper_8.safetensors',
      triggerWords: [],
      prompts: []
    },
    {
      id: 'l1',
      name: 'Pixel Art Style',
      type: 'LoRA',
      version: 'SDXL',
      description: 'Generates pixel art assets.',
      thumbnailUrl: 'https://picsum.photos/id/33/400/400',
      fileLocation: '/models/loras/pixel-art-xl.safetensors',
      triggerWords: ['pixel art', '8-bit'],
      preferredSettings: { cfgScale: 8.0 },
      prompts: []
    },
    {
      id: 'l2',
      name: 'Glass Sculptures',
      type: 'LoRA',
      version: 'SDXL',
      description: 'Makes things look like blown glass.',
      thumbnailUrl: 'https://picsum.photos/id/45/400/400',
      fileLocation: '/models/loras/glass-sculpture.safetensors',
      triggerWords: ['glass sculpture', 'translucent'],
      prompts: []
    },
    {
      id: 'v1',
      name: 'SDXL VAE',
      type: 'VAE',
      version: 'SDXL',
      description: 'Standard VAE for vivid colors.',
      fileLocation: '/models/vae/sdxl_vae.safetensors',
      prompts: []
    }
  ],
  combinations: [
    {
      id: 'c1',
      name: 'Cyberpunk Pixel',
      description: 'Best for retro-futuristic game assets',
      checkpointId: 'm1',
      vaeId: 'v1',
      loraIds: ['l1'],
      loraWeights: { 'l1': 0.8 },
      settings: { ...DEFAULT_SETTINGS, width: 1024, height: 1024, steps: 40 },
    }
  ]
};

export const getStoredData = (): AppState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load data", e);
  }
  return SEED_DATA;
};

export const saveStoredData = (data: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};