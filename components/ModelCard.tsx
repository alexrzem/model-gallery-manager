import React from 'react';
import { Model } from '../types';
import { MoreHorizontal, Star, Box, Tag, Trash2, Hash } from 'lucide-react';

interface ModelCardProps {
  model: Model;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onClick, onEdit, onDelete }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer hover:shadow-xl hover:shadow-indigo-900/5 dark:hover:shadow-indigo-900/20 shadow-sm"
    >
      <div className="aspect-[3/2] bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
        {model.thumbnailUrl ? (
          <img 
            src={model.thumbnailUrl} 
            alt={model.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
            <Box size={48} />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-xs font-mono px-2 py-1 rounded text-white border border-white/10">
          {model.version}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate" title={model.name}>
              {model.name}
            </h3>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider mb-1">
              {model.type}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button 
                onClick={onDelete}
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Delete Model"
            >
                <Trash2 size={18} />
            </button>
            <button 
                onClick={onEdit}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Edit Model"
            >
                <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3 min-h-[40px]">
          {model.description || "No description provided."}
        </p>
        
        {/* Tags Row */}
        <div className="flex flex-wrap gap-1 mb-3">
          {model.tags && model.tags.slice(0, 3).map((tag, i) => (
             <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-1">
               <Hash size={8} /> {tag}
             </span>
          ))}
          {model.tags && model.tags.length > 3 && (
             <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
               +{model.tags.length - 3}
             </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-3">
          <div className="flex items-center gap-1">
            <Tag size={12} />
            {model.triggerWords && model.triggerWords.length > 0 
              ? <span>{model.triggerWords.length} triggers</span>
              : <span>No triggers</span>
            }
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Star size={12} className="text-yellow-500" />
            <span>{model.prompts.length} Prompts</span>
          </div>
        </div>
      </div>
    </div>
  );
};