import { AppState, Model, Combination, GenerationSettings } from '@/types';

const DB_NAME = 'NeuroGalleryDB';
const DB_VERSION = 1;
const STORE_MODELS = 'models';
const STORE_COMBINATIONS = 'combinations';

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
      tags: ['Realistic', 'Photography', 'Cinematic'],
      fileLocation: '/models/sdxl/juggernautXL_v9.safetensors',
      preferredSettings: { steps: 35, cfgScale: 6.0, sampler: 'DPM++ 2M Karras' },
      prompts: [
        {
          id: 'p1',
          text: 'A futuristic city with flying cars, cyberpunk style, neon lights',
          settings: { ...DEFAULT_SETTINGS, steps: 40 },
          imageUrl: 'https://picsum.photos/id/12/400/400',
          createdAt: Date.now(),
        },
      ],
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
      tags: ['Artistic', 'Illustration', '2.5D'],
      prompts: [],
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
      tags: ['Game Asset', 'Retro', 'Pixel'],
      preferredSettings: { cfgScale: 8.0 },
      prompts: [],
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
      tags: ['Abstract', 'Material', '3D'],
      prompts: [],
    },
    {
      id: 'v1',
      name: 'SDXL VAE',
      type: 'VAE',
      version: 'SDXL',
      description: 'Standard VAE for vivid colors.',
      fileLocation: '/models/vae/sdxl_vae.safetensors',
      tags: ['Utility', 'Color'],
      prompts: [],
    },
  ],
  combinations: [
    {
      id: 'c1',
      name: 'Cyberpunk Pixel',
      description: 'Best for retro-futuristic game assets',
      checkpointId: 'm1',
      vaeId: 'v1',
      loraIds: ['l1'],
      loraWeights: { l1: 0.8 },
      settings: { ...DEFAULT_SETTINGS, width: 1024, height: 1024, steps: 40 },
    },
  ],
};

// Open Database Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MODELS)) {
        db.createObjectStore(STORE_MODELS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_COMBINATIONS)) {
        db.createObjectStore(STORE_COMBINATIONS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Generic Transaction Helper
function performTransaction<T>(storeName: string, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      let request;
      try {
        request = callback(store);
      } catch (e) {
        reject(e);
        return;
      }

      transaction.oncomplete = () => {
        if (request && 'result' in request) {
          resolve((request as IDBRequest).result);
        } else {
          resolve(undefined as T);
        }
        db.close();
      };

      transaction.onerror = () => {
        reject(transaction.error);
        db.close();
      };
    });
  });
}

// Generic GetAll Helper
function getAllFromStore<T>(storeName: string): Promise<T[]> {
  return performTransaction<T[]>(storeName, 'readonly', (store) => store.getAll());
}

// Initial Load and Seed
export async function loadAppState(): Promise<AppState> {
  const db = await openDB();

  // Check if empty to seed
  const modelsCount = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_MODELS, 'readonly');
    const countReq = tx.objectStore(STORE_MODELS).count();
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => reject(countReq.error);
  });

  if (modelsCount === 0) {
    // Seed Data
    const tx = db.transaction([STORE_MODELS, STORE_COMBINATIONS], 'readwrite');
    const modelStore = tx.objectStore(STORE_MODELS);
    const comboStore = tx.objectStore(STORE_COMBINATIONS);

    SEED_DATA.models.forEach((m) => modelStore.add(m));
    SEED_DATA.combinations.forEach((c) => comboStore.add(c));

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve(SEED_DATA);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  db.close();

  // Load Data
  const [models, combinations] = await Promise.all([getAllFromStore<Model>(STORE_MODELS), getAllFromStore<Combination>(STORE_COMBINATIONS)]);

  return { models, combinations };
}

// CRUD Operations
export function saveModel(model: Model): Promise<string> {
  return performTransaction(STORE_MODELS, 'readwrite', (store) => store.put(model)) as unknown as Promise<string>;
}

export async function saveModels(models: Model[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MODELS, 'readwrite');
    const store = tx.objectStore(STORE_MODELS);

    models.forEach((model) => store.put(model));

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function deleteModel(id: string): Promise<void> {
  return performTransaction(STORE_MODELS, 'readwrite', (store) => store.delete(id));
}

export function saveCombination(combo: Combination): Promise<string> {
  return performTransaction(STORE_COMBINATIONS, 'readwrite', (store) => store.put(combo)) as unknown as Promise<string>;
}

export function deleteCombination(id: string): Promise<void> {
  return performTransaction(STORE_COMBINATIONS, 'readwrite', (store) => store.delete(id));
}
