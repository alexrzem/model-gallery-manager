import React, { useState } from 'react';
import { Model, Combination, GenerationSettings } from '../types';
import { Plus, Save, Trash2, Sliders, Settings2, X } from 'lucide-react';

interface CombinationBuilderProps {
  models: Model[];
  combinations: Combination[];
  onSave: (combo: Combination) => void;
  onDelete: (id: string) => void;
}

export const CombinationBuilder: React.FC<CombinationBuilderProps> = ({ models, combinations, onSave, onDelete }) => {
  const checkpoints = models.filter(m => m.type === 'Checkpoint');
  const vaes = models.filter(m => m.type === 'VAE');
  const loras = models.filter(m => m.type === 'LoRA');
  const clips = models.filter(m => m.type === 'CLIP');
  const textEncoders = models.filter(m => m.type === 'TextEncoder');

  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('');
  const [selectedVae, setSelectedVae] = useState<string>('');
  const [selectedClip, setSelectedClip] = useState<string>('');
  const [selectedTextEncoder, setSelectedTextEncoder] = useState<string>('');
  const [selectedLoras, setSelectedLoras] = useState<string[]>([]);
  const [loraWeights, setLoraWeights] = useState<Record<string, number>>({});
  const [comboName, setComboName] = useState('');
  const [description, setDescription] = useState('');
  
  // New fields
  const [triggerWords, setTriggerWords] = useState('');
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7.0);
  const [sampler, setSampler] = useState('Euler a');

  const handleClear = () => {
    setEditingId(null);
    setComboName('');
    setDescription('');
    setSelectedCheckpoint('');
    setSelectedVae('');
    setSelectedClip('');
    setSelectedTextEncoder('');
    setSelectedLoras([]);
    setLoraWeights({});
    setTriggerWords('');
    setSteps(30);
    setCfgScale(7.0);
    setSampler('Euler a');
  };

  const handleSelect = (combo: Combination) => {
    setEditingId(combo.id);
    setComboName(combo.name);
    setDescription(combo.description);
    setSelectedCheckpoint(combo.checkpointId);
    setSelectedVae(combo.vaeId || '');
    setSelectedClip(combo.clipId || '');
    setSelectedTextEncoder(combo.textEncoderId || '');
    setSelectedLoras(combo.loraIds);
    setLoraWeights(combo.loraWeights);
    setTriggerWords(combo.triggerWords?.join(', ') || '');
    setSteps(combo.settings.steps);
    setCfgScale(combo.settings.cfgScale);
    setSampler(combo.settings.sampler);
  };

  const handleToggleLora = (id: string) => {
    if (selectedLoras.includes(id)) {
      setSelectedLoras(prev => prev.filter(l => l !== id));
      const newWeights = { ...loraWeights };
      delete newWeights[id];
      setLoraWeights(newWeights);
    } else {
      setSelectedLoras(prev => [...prev, id]);
      setLoraWeights(prev => ({ ...prev, [id]: 1.0 }));
    }
  };

  const handleLoraWeightChange = (id: string, value: string) => {
    let numValue = parseFloat(value);
    
    // Allow empty string to be 0 temporarily or handle backspace
    if (isNaN(numValue)) numValue = 0;
    
    // Clamp between 0 and 2
    if (numValue < 0) numValue = 0;
    if (numValue > 2) numValue = 2;

    setLoraWeights(prev => ({ ...prev, [id]: numValue }));
  };

  const handleSave = () => {
    if (!comboName || !selectedCheckpoint) return;
    
    const newCombo: Combination = {
      id: editingId || crypto.randomUUID(),
      name: comboName,
      description,
      checkpointId: selectedCheckpoint,
      vaeId: selectedVae || undefined,
      clipId: selectedClip || undefined,
      textEncoderId: selectedTextEncoder || undefined,
      loraIds: selectedLoras,
      loraWeights,
      triggerWords: triggerWords.split(',').map(s => s.trim()).filter(Boolean),
      settings: {
        steps,
        cfgScale,
        sampler,
        width: 1024,
        height: 1024
      }
    };
    onSave(newCombo);
    handleClear();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* List of Existing Combinations */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 overflow-y-auto shadow-sm dark:shadow-none">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <Save size={20} className="text-indigo-600 dark:text-indigo-500" />
          Saved Recipes
        </h2>
        <div className="space-y-4">
          {combinations.map(combo => {
            const cp = models.find(m => m.id === combo.checkpointId);
            const isEditing = editingId === combo.id;
            return (
              <div 
                key={combo.id} 
                onClick={() => handleSelect(combo)}
                className={`p-4 rounded-lg border transition-all cursor-pointer group ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-md shadow-indigo-900/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800/80'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold ${isEditing ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100'}`}>{combo.name}</h3>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDelete(combo.id); 
                      if (combo.id === editingId) handleClear(); 
                    }} 
                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{combo.description}</p>
                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">CP</span>
                    {cp?.name || 'Unknown'}
                  </div>
                  {combo.loraIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">LoRA</span>
                      {combo.loraIds.length} active
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {combo.vaeId && (
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">VAE</span>
                    )}
                    {combo.clipId && (
                        <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-900/50">CLIP</span>
                    )}
                    {combo.textEncoderId && (
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900/50">TE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                     <span className="text-slate-400">{combo.settings.steps} steps</span>
                     <span>•</span>
                     <span className="text-slate-400">CFG {combo.settings.cfgScale}</span>
                     <span>•</span>
                     <span className="text-slate-400">{combo.settings.sampler}</span>
                  </div>
                  {combo.triggerWords && combo.triggerWords.length > 0 && (
                     <div className="flex flex-wrap gap-1 mt-1">
                        {combo.triggerWords.map((tw, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300">{tw}</span>
                        ))}
                     </div>
                  )}
                </div>
              </div>
            );
          })}
          {combinations.length === 0 && (
            <div className="text-slate-500 dark:text-slate-600 text-center py-8">No recipes saved yet.</div>
          )}
        </div>
      </div>

      {/* Builder Form */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 overflow-y-auto shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sliders size={20} className="text-indigo-600 dark:text-indigo-500" />
            {editingId ? 'Edit Recipe' : 'Create New Recipe'}
            </h2>
            {editingId && (
                <button 
                  onClick={handleClear} 
                  className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
                >
                    <X size={14} /> Cancel Edit
                </button>
            )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Recipe Name</label>
               <input 
                 type="text" 
                 value={comboName}
                 onChange={e => setComboName(e.target.value)}
                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
                 placeholder="e.g. Cinematic Sci-Fi"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
               <input 
                 type="text" 
                 value={description}
                 onChange={e => setDescription(e.target.value)}
                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
                 placeholder="Brief notes..."
               />
             </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Trigger Words (Combined)</label>
            <input 
              type="text" 
              value={triggerWords}
              onChange={e => setTriggerWords(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-400 dark:placeholder-slate-600 transition-colors"
              placeholder="e.g. detailed, 8k, masterpiece (comma separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">1. Select Checkpoint (Base)</label>
            <select 
              value={selectedCheckpoint}
              onChange={e => setSelectedCheckpoint(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">-- Select Checkpoint --</option>
              {checkpoints.map(cp => (
                <option key={cp.id} value={cp.id}>{cp.name} ({cp.version})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">2. Add LoRAs (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800">
              {loras.map(lora => (
                <div 
                  key={lora.id}
                  onClick={() => handleToggleLora(lora.id)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedLoras.includes(lora.id) ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-500/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}
                >
                  <span className={`text-sm truncate ${selectedLoras.includes(lora.id) ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>{lora.name}</span>
                  {selectedLoras.includes(lora.id) && (
                     <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                       <input 
                         type="number" 
                         step="0.1"
                         min="0"
                         max="2"
                         value={loraWeights[lora.id] || 0}
                         onChange={(e) => handleLoraWeightChange(lora.id, e.target.value)}
                         className="w-16 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-xs text-right text-slate-900 dark:text-white"
                       />
                     </div>
                  )}
                </div>
              ))}
              {loras.length === 0 && <div className="text-slate-500 text-sm p-2">No LoRAs available.</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">3. Additional Models (Optional)</label>
                    
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 mt-2">VAE</label>
                    <select 
                        value={selectedVae}
                        onChange={e => setSelectedVae(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="">-- Default / None --</option>
                        {vaes.map(vae => (
                            <option key={vae.id} value={vae.id}>{vae.name}</option>
                        ))}
                    </select>

                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 mt-3">CLIP</label>
                    <select 
                        value={selectedClip}
                        onChange={e => setSelectedClip(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="">-- Default / None --</option>
                        {clips.map(clip => (
                            <option key={clip.id} value={clip.id}>{clip.name}</option>
                        ))}
                    </select>

                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 mt-3">Text Encoder</label>
                    <select 
                        value={selectedTextEncoder}
                        onChange={e => setSelectedTextEncoder(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="">-- Default / None --</option>
                        {textEncoders.map(te => (
                            <option key={te.id} value={te.id}>{te.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 h-fit">
                <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300 font-medium text-sm">
                   <Settings2 size={16} /> Generation Settings
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Steps</label>
                        <input 
                           type="number" 
                           value={steps}
                           onChange={e => setSteps(parseInt(e.target.value))}
                           className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">CFG Scale</label>
                        <input 
                           type="number" step="0.5"
                           value={cfgScale}
                           onChange={e => setCfgScale(parseFloat(e.target.value))}
                           className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-slate-200"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">Sampler</label>
                        <select 
                           value={sampler}
                           onChange={e => setSampler(e.target.value)}
                           className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-slate-200"
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

          <button
            onClick={handleSave}
            disabled={!comboName || !selectedCheckpoint}
            className={`w-full text-white font-semibold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-4 
              ${editingId 
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 dark:shadow-emerald-900/50' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 dark:shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
          >
            {editingId ? <Save size={20} /> : <Plus size={20} />}
            {editingId ? 'Update Recipe' : 'Save New Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
};