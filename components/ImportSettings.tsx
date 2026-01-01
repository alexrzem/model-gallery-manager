import React, { useState } from 'react';
import { AppState, Model, ModelType } from '../types';
import { Upload, Database, CheckCircle2, AlertCircle, FileUp, Image as ImageIcon, Search, Sparkles } from 'lucide-react';
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ imported: 0, skipped: 0 });
  const [thumbnailStrategy, setThumbnailStrategy] = useState<'none' | 'search' | 'generate'>('none');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  const mapInvokeType = (type: string): ModelType | null => {
    switch (type) {
      case 'main': return 'Checkpoint';
      case 'lora': return 'LoRA';
      case 'vae': return 'VAE';
      case 'embedding': return 'TextEncoder';
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      
      // Process models (fetching thumbnails if requested)
      for (let i = 0; i < potentialModels.length; i++) {
        const item = potentialModels[i];
        const { config, type, id } = item;
        
        let thumbUrl = undefined;
        
        if (thumbnailStrategy !== 'none') {
           setProcessedCount(i + 1);
           setMessage(`Processing ${i + 1}/${potentialModels.length}: ${config.name}`);
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
            name: config.name || 'Unknown Model',
            type: type,
            version: mapInvokeBase(config.base) || 'Unknown',
            description: config.description || '',
            triggerWords: Array.isArray(config.trigger_phrases) ? config.trigger_phrases : [],
            fileLocation: config.path || '',
            prompts: [], 
            thumbnailUrl: thumbUrl
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
      setMessage(err.message || "Failed to import database.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
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

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-950/50">
          <input
            type="file"
            id="db-upload"
            accept=".db,.sqlite"
            onChange={handleFileUpload}
            className="hidden"
            disabled={status === 'loading' || status === 'processing'}
          />
          <label htmlFor="db-upload" className={`cursor-pointer flex flex-col items-center gap-3 ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Supported Import Types</h3>
         <div className="grid grid-cols-2 gap-4 text-sm">
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
         </div>
      </div>
    </div>
  );
};