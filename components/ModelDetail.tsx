import React, { useState } from 'react';
import { Model, PromptEntry, MODEL_FAMILIES } from '../types';
import { X, Save, Wand2, Image as ImageIcon, Copy, BrainCircuit, ChevronDown, Trash2 } from 'lucide-react';
import { generateDescription, enhancePrompt } from '../services/geminiService';

interface ModelDetailProps {
  model: Model;
  onClose: () => void;
  onUpdate: (updated: Model) => void;
  onDelete: () => void;
}

export const ModelDetail: React.FC<ModelDetailProps> = ({ model, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'prompts' | 'settings'>('info');
  const [editedModel, setEditedModel] = useState<Model>({ ...model });
  const [newPromptText, setNewPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSaveInfo = () => {
    onUpdate(editedModel);
    onClose();
  };

  const handleAiDescription = async () => {
    setIsGenerating(true);
    const desc = await generateDescription(editedModel.name, editedModel.type, editedModel.triggerWords?.join(', ') || '');
    setEditedModel(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleAiEnhancePrompt = async () => {
    if(!newPromptText) return;
    setIsGenerating(true);
    const enhanced = await enhancePrompt(newPromptText);
    setNewPromptText(enhanced);
    setIsGenerating(false);
  }

  const addPrompt = () => {
    if (!newPromptText) return;
    const newEntry: PromptEntry = {
      id: crypto.randomUUID(),
      text: newPromptText,
      settings: {
        steps: editedModel.preferredSettings?.steps || 30,
        cfgScale: editedModel.preferredSettings?.cfgScale || 7,
        sampler: editedModel.preferredSettings?.sampler || 'Euler a',
        width: 1024, 
        height: 1024
      },
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`, // Placeholder
      createdAt: Date.now()
    };
    const updated = {
      ...editedModel,
      prompts: [newEntry, ...editedModel.prompts]
    };
    setEditedModel(updated);
    onUpdate(updated); // Auto save when adding prompt
    setNewPromptText('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700 flex overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Column: Image & Quick Info */}
        <div className="w-1/3 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col border-r border-slate-200 dark:border-slate-800">
          <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 mb-6 border border-slate-200 dark:border-slate-700 group relative shadow-inner">
             <img src={editedModel.thumbnailUrl || 'https://via.placeholder.com/400'} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs px-2 py-1 bg-black/60 rounded border border-white/10 cursor-not-allowed">Change Thumbnail</span>
             </div>
          </div>
          
          <div className="space-y-4 mb-4">
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                   <div className="px-3 py-2 rounded bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-sm font-mono truncate cursor-default" title={editedModel.type}>
                      {editedModel.type}
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Family</label>
                   <div className="relative">
                     <select 
                       value={editedModel.version}
                       onChange={e => setEditedModel({...editedModel, version: e.target.value})}
                       className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-2 pr-6 py-2 text-slate-900 dark:text-slate-200 text-sm focus:border-indigo-500 focus:outline-none appearance-none"
                     >
                       {MODEL_FAMILIES.map(f => (
                         <option key={f} value={f}>{f}</option>
                       ))}
                       {!MODEL_FAMILIES.includes(editedModel.version as any) && (
                         <option value={editedModel.version}>{editedModel.version}</option>
                       )}
                     </select>
                     <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                   </div>
                </div>
             </div>
          </div>

          <div className="flex-1"></div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
             <button 
               onClick={handleSaveInfo}
               className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
             >
               <Save size={18} />
               Save Changes
             </button>
             
             <button 
               onClick={onDelete}
               className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
             >
               <Trash2 size={16} />
               Delete Model
             </button>
          </div>
        </div>

        {/* Right Column: Tabs & Content */}
        <div className="w-2/3 flex flex-col bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
             <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Settings & Triggers
                </button>
                <button 
                  onClick={() => setActiveTab('prompts')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'prompts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Prompt Gallery
                </button>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
               <X size={24} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                
                {/* Moved Content: Name, Location, Description */}
                <div className="grid grid-cols-1 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model Name</label>
                      <input 
                        type="text" 
                        value={editedModel.name}
                        onChange={e => setEditedModel({...editedModel, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-bold text-lg focus:border-indigo-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-colors"
                        placeholder="Model Name"
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">File Location</label>
                      <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-500 dark:text-slate-400 text-xs font-mono break-all leading-tight">
                        {editedModel.fileLocation || "N/A"}
                      </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                       <textarea 
                         className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
                         value={editedModel.description}
                         onChange={e => setEditedModel({...editedModel, description: e.target.value})}
                       />
                       <button 
                         onClick={handleAiDescription}
                         disabled={isGenerating}
                         className="mt-2 w-full flex items-center justify-center gap-2 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 py-2 rounded-lg transition-colors"
                       >
                         {isGenerating ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent"/> : <BrainCircuit size={14} />}
                         Generate Description with AI
                       </button>
                   </div>
                </div>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-2"></div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Trigger Words (comma separated)</label>
                  <input 
                    type="text" 
                    value={editedModel.triggerWords?.join(', ') || ''}
                    onChange={e => setEditedModel({...editedModel, triggerWords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. masterpiece, best quality"
                  />
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                   <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                     <Wand2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                     Best Settings
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Steps</label>
                        <input 
                          type="number" 
                          value={editedModel.preferredSettings?.steps || 30}
                          onChange={e => setEditedModel({...editedModel, preferredSettings: {...editedModel.preferredSettings, steps: parseInt(e.target.value)}})}
                          className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">CFG Scale</label>
                        <input 
                          type="number" step="0.5"
                          value={editedModel.preferredSettings?.cfgScale || 7}
                          onChange={e => setEditedModel({...editedModel, preferredSettings: {...editedModel.preferredSettings, cfgScale: parseFloat(e.target.value)}})}
                          className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Sampler</label>
                        <select 
                           value={editedModel.preferredSettings?.sampler || 'Euler a'}
                           onChange={e => setEditedModel({...editedModel, preferredSettings: {...editedModel.preferredSettings, sampler: e.target.value}})}
                           className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-slate-200"
                        >
                           <option>Euler a</option>
                           <option>DPM++ 2M Karras</option>
                           <option>DDIM</option>
                           <option>UniPC</option>
                        </select>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'prompts' && (
              <div className="space-y-6">
                 {/* Prompt Input Area */}
                 <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Record a successful prompt</label>
                    <div className="relative">
                      <textarea 
                        value={newPromptText}
                        onChange={e => setNewPromptText(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 h-24 pr-24 transition-colors"
                        placeholder="Type prompt here..."
                      />
                      <button 
                        onClick={handleAiEnhancePrompt}
                        disabled={isGenerating || !newPromptText}
                        className="absolute bottom-2 right-2 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1"
                      >
                         {isGenerating ? "..." : <SparkleIcon />} Enhance
                      </button>
                    </div>
                    <button 
                       onClick={addPrompt}
                       disabled={!newPromptText}
                       className="mt-3 w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                       Add to Gallery
                    </button>
                 </div>

                 {/* Gallery Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    {editedModel.prompts.map(prompt => (
                       <div key={prompt.id} className="bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 group">
                          <div className="aspect-square relative">
                             <img src={prompt.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                             <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-xs text-white line-clamp-2">{prompt.text}</p>
                             </div>
                          </div>
                          <div className="p-2 flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                             <div className="text-[10px] text-slate-500 font-mono">
                                {prompt.settings.width}x{prompt.settings.height} • {prompt.settings.steps}s
                             </div>
                             <button 
                               onClick={() => navigator.clipboard.writeText(prompt.text)}
                               className="text-slate-400 hover:text-slate-900 dark:hover:text-white" title="Copy Prompt"
                             >
                                <Copy size={14} />
                             </button>
                          </div>
                       </div>
                    ))}
                    {editedModel.prompts.length === 0 && (
                       <div className="col-span-2 text-center py-12 text-slate-500 dark:text-slate-600 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                          <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                          <p>No prompts recorded yet.</p>
                       </div>
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
)