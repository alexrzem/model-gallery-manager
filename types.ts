export const MODEL_TYPES = [
    { id: 'checkpoint', label: 'Checkpoint' },
    { id: 'clip', label: 'CLIP' },
    { id: 'clipembed', label: 'CLIPEmbed' },
    { id: 'clipvision', label: 'CLIPVision' },
    { id: 'controlnet', label: 'ControlNet' },
    { id: 'embedding', label: 'Embedding' },
    { id: 'ipadapter', label: 'IPAdapter' },
    { id: 'lora', label: 'LoRA' },
    { id: 'textencoder', label: 'TextEncoder' },
    { id: 'vae', label: 'VAE' },
];

export const SAMPLERS = [
    { id: 'euler_a', label: 'Euler a' },
    { id: 'dpm_plus_plus_2m_karras', label: 'DPM++ 2M Karras' },
    { id: 'ddim', label: 'DDIM' },
    { id: 'unipc', label: 'UniPC' },
];

export type ModelType = 'Checkpoint' | 'LoRA' | 'VAE' | 'TextEncoder' | 'CLIP' | 'ControlNet' | 'IPAdapter' | 'CLIPVision' | 'Embedding' | 'CLIPEmbed';
export const MODEL_FAMILIES = ['Flux v1', 'Flux v1 - Kontext', 'Flux v2', 'Qwen v3', 'SDXL', 'SD v1.5', 'SD v2', 'SD v3', 'SD v3.5', 'Z-Index v1'] as const;

export interface GenerationSettings {
    steps: number;
    cfgScale: number;
    sampler: string;
    width: number;
    height: number;
    seed?: number;
    negativePrompt?: string;
    clipSkip?: number;
}

export interface PromptEntry {
    id: string;
    text: string;
    settings: GenerationSettings; // Settings used for this specific prompt result
    imageUrl?: string;
    createdAt: number;
}

export interface Model {
    id: string;
    name: string;
    type: ModelType;
    version: string; // e.g., SD 1.5, SDXL, Pony
    description: string;
    thumbnailUrl?: string;
    triggerWords?: string[];
    tags?: string[]; // Style tags for filtering
    fileLocation?: string;

    // Best global settings for this model
    preferredSettings?: Partial<GenerationSettings>;

    // Associated Prompts/Gallery
    prompts: PromptEntry[];
}

export interface Combination {
    id: string;
    name: string;
    description: string;
    checkpointId: string;
    vaeId?: string;
    clipId?: string;
    textEncoderId?: string;
    loraIds: string[]; // Array of LoRA IDs
    loraWeights: Record<string, number>; // Map LoRA ID to weight
    settings: GenerationSettings;
    notes?: string;
    triggerWords?: string[];
    referenceImageUrl?: string;
}

export interface User {
    name: string;
    email: string;
    picture: string;
}

export interface AppState {
    models: Model[];
    combinations: Combination[];
}
