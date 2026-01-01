import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelCard } from './components/ModelCard';
import { CombinationBuilder } from './components/CombinationBuilder';
import { ModelDetail } from './components/ModelDetail';
import { ImportSettings } from './components/ImportSettings';
import { loadAppState, saveModel, deleteModel, saveCombination, deleteCombination, saveModels } from './services/storage';
import { AppState, Model, Combination, ModelType } from './types';
import { Search, Plus, Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppState>({ models: [], combinations: [] });
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const initData = async () => {
        try {
            const appState = await loadAppState();
            setData(appState);
        } catch (e) {
            console.error("Failed to load IndexedDB", e);
        } finally {
            setLoading(false);
        }
    };
    initData();
    
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
        const next = !prev;
        if (next) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', next ? 'dark' : 'light');
        return next;
    });
  };

  const handleUpdateModel = async (updatedModel: Model) => {
    // Optimistic Update
    const updatedModels = data.models.map(m => m.id === updatedModel.id ? updatedModel : m);
    setData(prev => ({ ...prev, models: updatedModels }));
    setSelectedModel(updatedModel); // keep open

    // Async Save
    try {
        await saveModel(updatedModel);
    } catch (e) {
        console.error("Failed to save model", e);
        // revert logic could go here
    }
  };

  const handleDeleteModel = async (modelId: string) => {
     if(confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
        // Optimistic Update
        const updatedModels = data.models.filter(m => m.id !== modelId);
        setData(prev => ({ ...prev, models: updatedModels }));
        
        // If the deleted model was selected (modal open), close it
        if (selectedModel?.id === modelId) {
            setSelectedModel(null);
        }

        // Async Delete
        await deleteModel(modelId);
     }
  };

  const handleSaveCombination = async (combo: Combination) => {
    const exists = data.combinations.some(c => c.id === combo.id);
    let newCombinations;
    
    if (exists) {
      newCombinations = data.combinations.map(c => c.id === combo.id ? combo : c);
    } else {
      newCombinations = [...data.combinations, combo];
    }
    
    setData(prev => ({ ...prev, combinations: newCombinations }));
    await saveCombination(combo);
  };

  const handleDeleteCombination = async (id: string) => {
    const newCombinations = data.combinations.filter(c => c.id !== id);
    setData(prev => ({ ...prev, combinations: newCombinations }));
    await deleteCombination(id);
  };
  
  const handleAddModel = async (type: ModelType) => {
    const newModel: Model = {
        id: crypto.randomUUID(),
        name: `New ${type}`,
        type: type,
        version: 'SDXL',
        description: '',
        prompts: []
    };
    
    setData(prev => ({ ...prev, models: [newModel, ...prev.models] }));
    setSelectedModel(newModel);
    await saveModel(newModel);
  };

  const handleImportModels = async (importedModels: Model[]) => {
    setData(prev => ({ ...prev, models: [...prev.models, ...importedModels] }));
    await saveModels(importedModels);
  };

  // Filter models based on active tab and search
  const filteredModels = data.models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === 'checkpoints') return m.type === 'Checkpoint';
    if (activeTab === 'loras') return m.type === 'LoRA';
    if (activeTab === 'others') return ['VAE', 'TextEncoder', 'CLIP'].includes(m.type);
    return true; // Dashboard shows all? Or maybe summary?
  });

  const renderContent = () => {
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Loader2 className="animate-spin" size={32} />
                <p>Loading Library...</p>
            </div>
        );
    }

    if (activeTab === 'settings') {
      return (
        <ImportSettings 
          onImport={handleImportModels} 
          existingModels={data.models} 
        />
      );
    }

    if (activeTab === 'combinations') {
      return (
        <CombinationBuilder 
          models={data.models} 
          combinations={data.combinations}
          onSave={handleSaveCombination}
          onDelete={handleDeleteCombination}
        />
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Models" value={data.models.length} color="bg-blue-600" />
          <StatCard title="Checkpoints" value={data.models.filter(m => m.type === 'Checkpoint').length} color="bg-indigo-600" />
          <StatCard title="LoRAs" value={data.models.filter(m => m.type === 'LoRA').length} color="bg-purple-600" />
          <StatCard title="Combinations" value={data.combinations.length} color="bg-emerald-600" />
          
          <div className="md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Models</h3>
             <div className="space-y-3">
               {data.models.slice(0, 3).map(m => (
                 <div key={m.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setSelectedModel(m)}>
                   <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden flex-shrink-0">
                      {m.thumbnailUrl && <img src={m.thumbnailUrl} className="w-full h-full object-cover" />}
                   </div>
                   <div>
                     <div className="font-medium text-slate-900 dark:text-slate-200">{m.name}</div>
                     <div className="text-xs text-slate-500">{m.type} • {m.version}</div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      );
    }

    // List view for models
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => handleAddModel(activeTab === 'checkpoints' ? 'Checkpoint' : activeTab === 'loras' ? 'LoRA' : 'VAE')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add {activeTab === 'others' ? 'Model' : activeTab.slice(0, -1)}
              </button>
            </div>
         </div>

         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm dark:shadow-none placeholder-slate-400 dark:placeholder-slate-500"
            />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModels.map(model => (
               <ModelCard 
                 key={model.id} 
                 model={model} 
                 onClick={() => setSelectedModel(model)}
                 onEdit={(e) => { e.stopPropagation(); setSelectedModel(model); }}
                 onDelete={(e) => {
                    e.stopPropagation();
                    handleDeleteModel(model.id);
                 }}
               />
            ))}
            {filteredModels.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500">
                No models found.
              </div>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans flex transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 ml-20 p-8 overflow-y-auto h-screen transition-all duration-300">
         <div className="max-w-7xl mx-auto h-full">
           {renderContent()}
         </div>
      </main>

      {selectedModel && (
        <ModelDetail 
          model={selectedModel} 
          onClose={() => setSelectedModel(null)} 
          onUpdate={handleUpdateModel}
          onDelete={() => handleDeleteModel(selectedModel.id)}
        />
      )}
    </div>
  );
}

const StatCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
     <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
     <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">{title}</h3>
     <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);