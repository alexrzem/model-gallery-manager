import React, { useState } from 'react';
import { AppState, Model, ModelType, MODEL_FAMILIES } from '../types';
import { Upload, Database, CheckCircle2, AlertCircle, FileUp, Image as ImageIcon, Search, Sparkles, FileType, Hash, ExternalLink, Plus, Loader2 } from 'lucide-react';
import { findImageForModel, generateThumbnailForModel } from '../services/geminiService';

interface ImportSettingsProps {
  onImport: (models: Model[]) => void;
  existingModels: Model[];
}

declare global {
  interface Window {
    initSqlJs: any;
  }
}

export const ImportSettings: React.FC<ImportSettingsProps> = ({ onImport, existingModels }) => {
  const [activeTab, setActiveTab] = useState<'db' | 'file'>('db');
  
  // DB Import State
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ imported: 0, skipped: 0 });
  const [thumbnailStrategy, setThumbnailStrategy] = useState<'none' | 'search' | 'generate'>('none');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  // File Import State
  const [fileStatus, setFileStatus] = useState<'idle' | 'hashing' | 'looking_up' | 'ready' | 'error'>('idle');
  const [fileHash, setFileHash] = useState('');
  const [scannedModel, setScannedModel] = useState<Partial<Model> | null>(null);
  const [fileError, setFileError] = useState('');

  // Drag State
  const [isDraggingDb, setIsDraggingDb] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const mapInvokeType = (type: string): ModelType | null => {
    switch (type) {
      case 'main': return 'Checkpoint';
      case 'lora': return 'LoRA';
      case 'vae': return 'VAE';
      case 'embedding': return 'Embedding';
      case 'text_encoder': return 'TextEncoder';
      case 'clip': return 'CLIP';
      case 'controlnet': return 'ControlNet';
      case 'ip_adapter': return 'IPAdapter';
      case 'clip_vision': return 'CLIPVision';
      case 'clip_embed': return 'CLIPEmbed';
      default: return null;
    }
  };

  const mapInvokeBase = (base: string): string => {
    switch (base) {
      case 'sd-1': return 'SD v1.5';
      case 'sd-2': return 'SD v2';
      case 'sdxl': return 'SDXL';
      case 'flux': return 'Flux v1';
      default: return base;
    }
  };

  const mapCivitAiType = (type: string): ModelType => {
      switch(type) {
          case 'Checkpoint': return 'Checkpoint';
          case 'LORA': return 'LoRA';
          case 'LoCon': return 'LoRA';
          case 'TextualInversion': return 'Embedding';
          case 'VAE': return 'VAE';
          case 'ControlNet': return 'ControlNet';
          default: return 'Checkpoint'; // Fallback
      }
  };

  const processDatabaseFile = async (file: File) => {
    setStatus('loading');
    setMessage('Loading database...');
    setStats({ imported: 0, skipped: 0 });
    setProcessedCount(0);
    setTotalToProcess(0);

    try {
      if (!window.initSqlJs) {
        throw new Error("SQL.js not loaded. Please refresh the page.");
      }

      const SQL = await window.initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
      });

      const buffer = await file.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(buffer));

      const stmt = db.prepare("SELECT id, config FROM models");
      
      const potentialModels: any[] = [];
      let skippedCount = 0;

      while (stmt.step()) {
        const row = stmt.getAsObject();
        try {
          const config = JSON.parse(row.config as string);
          
          const type = mapInvokeType(config.type);
          if (!type) continue;

          if (existingModels.some(m => m.id === String(row.id) || m.name === config.name)) {
            skippedCount++;
            continue;
          }

          potentialModels.push({
            id: String(row.id),
            config,
            type
          });
        } catch (err) {
          console.warn("Failed to parse model row", row, err);
        }
      }

      stmt.free();
      db.close();

      setTotalToProcess(potentialModels.length);
      setStatus('processing');
      setMessage(thumbnailStrategy !== 'none' ? 'Processing models and fetching thumbnails...' : 'Importing models...');

      const newModels: Model[] = [];
      
      for (let i = 0; i < potentialModels.length; i++) {
        const item = potentialModels[i];
        const { config, type, id } = item;
        
        let thumbUrl = undefined;
        let civitData = null;
        let hash = null;

        // Check if config has a SHA256 hash
        if (typeof config.hash === 'string' && config.hash.startsWith('sha256:')) {
            hash = config.hash.slice(7); // Remove 'sha256:' prefix
        }

        // Update progress if we are doing work (hash lookup or thumb generation)
        if (hash || thumbnailStrategy !== 'none') {
             setProcessedCount(i + 1);
             setMessage(`Processing ${i + 1}/${potentialModels.length}: ${config.name}${hash ? ' (Checking CivitAI...)' : ''}`);
        }

        // If hash exists, try to fetch metadata from CivitAI
        if (hash) {
             try {
                 const res = await fetch(`https://civitai.com/api/v1/model-versions/by-hash/${hash}`);
                 if (res.ok) {
                     civitData = await res.json();
                 }
             } catch(e) {
                 console.warn(`CivitAI lookup failed for ${config.name}`, e);
             }
        }
        
        // Determine Thumbnail (Priority: CivitAI -> Strategy -> None)
        if (civitData?.images?.[0]?.url) {
            thumbUrl = civitData.images[0].url;
        } else if (thumbnailStrategy !== 'none') {
           try {
             if (thumbnailStrategy === 'search') {
               thumbUrl = await findImageForModel(config.name);
             } else {
               thumbUrl = await generateThumbnailForModel(config.name, type);
             }
           } catch (e) {
             console.warn(`Thumbnail fetch failed for ${config.name}`);
           }
        }

        const model: Model = {
            id: id,
            // Use CivitAI name if available, else config name
            name: civitData?.model?.name ? `${civitData.model.name} (${civitData.name})` : (config.name || 'Unknown Model'),
            type: type, // Keep InvokeAI type for consistency
            version: civitData?.baseModel || mapInvokeBase(config.base) || 'Unknown',
            description: civitData?.description?.replace(/<[^>]*>/g, '').slice(0, 300) + '...' || config.description || '',
            triggerWords: civitData?.trainedWords || (Array.isArray(config.trigger_phrases) ? config.trigger_phrases : []),
            fileLocation: config.path || '',
            prompts: [], 
            thumbnailUrl: thumbUrl,
            tags: civitData?.model?.tags || []
        };
        newModels.push(model);
      }

      onImport(newModels);
      setStats({ imported: newModels.length, skipped: skippedCount });
      setStatus('success');
      setMessage(`Successfully processed database.`);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || "Failed to import database. Ensure the file is not locked by another application.");
    }
  };

  const handleDbUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processDatabaseFile(file);
    }
    e.target.value = '';
  };

  const processModelFile = async (file: File) => {
      setFileStatus('hashing');
      setFileError('');
      setScannedModel(null);
      setFileHash('');

      try {
          // Calculate SHA256
          const buffer = await file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
          
          setFileHash(hashHex);
          setFileStatus('looking_up');

          // Lookup CivitAI
          const response = await fetch(`https://civitai.com/api/v1/model-versions/by-hash/${hashHex}`);
          
          let modelData: Partial<Model> = {
              id: crypto.randomUUID(),
              fileLocation: file.name,
              prompts: [],
              tags: []
          };

          if (response.ok) {
              const data = await response.json();
              
              // Map CivitAI data
              modelData = {
                  ...modelData,
                  name: data.model?.name ? `${data.model.name} (${data.name})` : file.name,
                  type: mapCivitAiType(data.model?.type),
                  version: data.baseModel || 'Unknown',
                  description: data.description?.replace(/<[^>]*>/g, '').slice(0, 300) + '...' || '',
                  thumbnailUrl: data.images?.[0]?.url,
                  triggerWords: data.trainedWords || [],
                  tags: data.model?.tags || []
              };
          } else {
              // Fallback if not found
              modelData = {
                  ...modelData,
                  name: file.name.split('.')[0].replace(/_/g, ' '),
                  type: 'Checkpoint', // Default assumption
                  version: 'SDXL', // Default assumption
                  description: 'Imported local file. Metadata not found in CivitAI.'
              };
          }

          setScannedModel(modelData);
          setFileStatus('ready');

      } catch (err: any) {
          console.error(err);
          let errMsg = "Failed to process file.";
          if (err.name === 'NotReadableError') {
             errMsg = "Could not read file. Ensure it is not locked by another application.";
          } else if (file.size > 2 * 1024 * 1024 * 1024) {
             errMsg = "File is too large for browser-based hashing (Limit is approx 2GB).";
          }
          setFileError(errMsg);
          setFileStatus('error');
      }
  };

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          processModelFile(file);
      }
      e.target.value = '';
  };

  const saveScannedModel = () => {
      if (scannedModel) {
          onImport([scannedModel as Model]);
          setFileStatus('idle');
          setScannedModel(null);
          setFileHash('');
          // Optional: Switch tab or show success toast
          alert('Model added successfully!');
      }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDbDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDb(true);
  };

  const handleDbDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDb(false);
  };

  const handleDbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDb(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
        processDatabaseFile(file);
    }
  };

  const handleFileDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
        processModelFile(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit mx-auto mb-6">
         <button 
           onClick={() => setActiveTab('db')}
           className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'db' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
         >
            <Database size={16} /> Import Database
         </button>
         <button 
           onClick={() => setActiveTab('file')}
           className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'file' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
         >
            <FileType size={16} /> Import Model File
         </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        {activeTab === 'db' ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import from InvokeAI</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Upload your <code>invokeai.db</code> file to import models.</p>
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <ImageIcon size={16} />
                Thumbnail Generation
              </h3>
              <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setThumbnailStrategy('none')}
                    className={`text-xs p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${thumbnailStrategy === 'none' ? 'bg-white dark:bg-slate-800 border-indigo-500 text-indigo-700 dark:text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center"><FileUp size={16} /></div>
                    None
                  </button>
                  <button 
                    onClick={() => setThumbnailStrategy('search')}
                    className={`text-xs p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${thumbnailStrategy === 'search' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center"><Search size={16} /></div>
                    Search Google
                  </button>
                  <button 
                    onClick={() => setThumbnailStrategy('generate')}
                    className={`text-xs p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${thumbnailStrategy === 'generate' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center"><Sparkles size={16} /></div>
                    Generate AI
                  </button>
              </div>
              {thumbnailStrategy !== 'none' && (
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Note: This will significantly increase import time as it processes each model individually.
                </p>
              )}
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragEnter={handleDbDragEnter}
              onDragLeave={handleDbDragLeave}
              onDrop={handleDbDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors bg-slate-50 dark:bg-slate-950/50 
                ${isDraggingDb 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500'}`}
            >
              <input
                type="file"
                id="db-upload"
                accept=".db,.sqlite"
                onChange={handleDbUploadChange}
                className="hidden"
              />
              <label htmlFor="db-upload" className={`cursor-pointer flex flex-col items-center gap-3 ${status === 'loading' || status === 'processing' ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                  {status === 'loading' || status === 'processing' ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                  ) : (
                    <FileUp size={32} />
                  )}
                </div>
                <div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Click to upload</span>
                  <span className="text-slate-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-600">Supported formats: .db, .sqlite</p>
              </label>
            </div>

            {status === 'processing' && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Processing...</span>
                  <span>{processedCount} / {totalToProcess}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${(processedCount / totalToProcess) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="mt-6 bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-emerald-700 dark:text-emerald-400 font-medium">Import Complete</h3>
                  <p className="text-emerald-600 dark:text-emerald-500/80 text-sm mt-1">
                    {message} Added {stats.imported} models. Skipped {stats.skipped} duplicates.
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-6 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-red-700 dark:text-red-400 font-medium">Import Failed</h3>
                  <p className="text-red-600 dark:text-red-500/80 text-sm mt-1">{message}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                <Hash size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">File Identification & Import</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Calculate hash and identify models using CivitAI.</p>
              </div>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragEnter={handleFileDragEnter}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors bg-slate-50 dark:bg-slate-950/50
                ${isDraggingFile 
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-pink-500 dark:hover:border-pink-500'}`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".safetensors,.ckpt,.pt,.bin"
                onChange={handleModelFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center gap-3 ${fileStatus === 'hashing' || fileStatus === 'looking_up' ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:text-pink-600 dark:group-hover:text-white transition-colors">
                  {fileStatus === 'hashing' || fileStatus === 'looking_up' ? (
                     <Loader2 className="animate-spin text-pink-500" size={32} />
                  ) : (
                     <FileUp size={32} />
                  )}
                </div>
                <div>
                  <span className="text-pink-600 dark:text-pink-400 font-medium hover:underline">Select Model File</span>
                  <span className="text-slate-500"> (.safetensors, .ckpt)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-600">Calculates SHA256 in browser. Max file size depends on browser/RAM.</p>
              </label>
            </div>

            {fileStatus !== 'idle' && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {/* Hash Display */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg flex items-center justify-between">
                       <div className="flex items-center gap-3 overflow-hidden">
                           <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                               <Hash size={14} className="text-slate-600 dark:text-slate-400" />
                           </div>
                           <div className="flex flex-col min-w-0">
                               <span className="text-xs font-bold text-slate-500 uppercase">SHA256 Hash</span>
                               <code className="text-xs text-slate-700 dark:text-slate-300 truncate font-mono">
                                   {fileHash || 'Calculating...'}
                               </code>
                           </div>
                       </div>
                       {fileHash && (
                           <div className="flex gap-2 shrink-0">
                               <a 
                                 href={`https://civarchive.com/models?hash=${fileHash}`} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded text-slate-500 hover:text-blue-500"
                                 title="Check CivArchive"
                               >
                                   <ExternalLink size={16} />
                               </a>
                               <a 
                                 href="https://github.com/airborne-commando/civitai-mirror-list"
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded text-slate-500 hover:text-green-500"
                                 title="Check Mirror List"
                               >
                                   <Search size={16} />
                               </a>
                           </div>
                       )}
                    </div>

                    {fileStatus === 'error' && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {fileError}
                        </div>
                    )}

                    {fileStatus === 'ready' && scannedModel && (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-lg">
                             <div className="md:w-1/3 bg-slate-200 dark:bg-slate-900 relative min-h-[200px]">
                                {scannedModel.thumbnailUrl ? (
                                    <img src={scannedModel.thumbnailUrl} className="w-full h-full object-cover absolute inset-0" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                             </div>
                             <div className="p-6 md:w-2/3 flex flex-col">
                                 <div className="flex-1">
                                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{scannedModel.name}</h3>
                                     <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                         <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">{scannedModel.type}</span>
                                         <span>{scannedModel.version}</span>
                                     </div>
                                     <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                                         {scannedModel.description}
                                     </p>
                                     <div className="flex flex-wrap gap-1">
                                         {scannedModel.triggerWords?.map(tw => (
                                             <span key={tw} className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{tw}</span>
                                         ))}
                                     </div>
                                 </div>
                                 <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                                     <button 
                                       onClick={saveScannedModel}
                                       className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                                     >
                                         <Plus size={18} /> Add to Library
                                     </button>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Supported Import Types</h3>
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
               Main Checkpoints
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-purple-500"></span>
               LoRAs / LyCORIS
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
               VAEs
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-pink-500"></span>
               Text Encoders
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-orange-500"></span>
               CLIP Models
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
               ControlNet
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
               IP Adapter
            </div>
             <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
               Embeddings
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
               <span className="w-2 h-2 rounded-full bg-red-500"></span>
               CLIP Vision
            </div>
         </div>
      </div>
    </div>
  );
};