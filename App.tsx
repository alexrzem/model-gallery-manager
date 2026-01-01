import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelCard } from './components/ModelCard';
import { CombinationBuilder } from './components/CombinationBuilder';
import { ModelDetail } from './components/ModelDetail';
import { ImportSettings } from './components/ImportSettings';
import { getStoredData, saveStoredData } from './services/storage';
import { AppState, Model, Combination, ModelType } from './types';
import { Search, Plus } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppState>({ models: [], combinations: [] });
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setData(getStoredData());
  }, []);

  const handleUpdateModel = (updatedModel: Model) => {
    const updatedModels = data.models.map(m => m.id === updatedModel.id ? updatedModel : m);
    const newData = { ...data, models: updatedModels };
    setData(newData);
    saveStoredData(newData);
    setSelectedModel(updatedModel); // keep open
  };

  const handleDeleteModel = (modelId: string) => {
     if(confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
        const newData = { ...data, models: data.models.filter(m => m.id !== modelId) };
        setData(newData);
        saveStoredData(newData);
        
        // If the deleted model was selected (modal open), close it
        if (selectedModel?.id === modelId) {
            setSelectedModel(null);
        }
     }
  };

  const handleSaveCombination = (combo: Combination) => {
    const exists = data.combinations.some(c => c.id === combo.id);
    let newCombinations;
    
    if (exists) {
      newCombinations = data.combinations.map(c => c.id === combo.id ? combo : c);
    } else {
      newCombinations = [...data.combinations, combo];
    }
    
    const newData = { ...data, combinations: newCombinations };
    setData(newData);
    saveStoredData(newData);
  };

  const handleDeleteCombination = (id: string) => {
    const newData = { ...data, combinations: data.combinations.filter(c => c.id !== id) };
    setData(newData);
    saveStoredData(newData);
  };
  
  const handleAddModel = (type: ModelType) => {
    const newModel: Model = {
        id: crypto.randomUUID(),
        name: `New ${type}`,
        type: type,
        version: 'SDXL',
        description: '',
        prompts: []
    };
    const newData = { ...data, models: [newModel, ...data.models] };
    setData(newData);
    saveStoredData(newData);
    setSelectedModel(newModel);
  };

  const handleImportModels = (importedModels: Model[]) => {
    const newData = { ...data, models: [...data.models, ...importedModels] };
    setData(newData);
    saveStoredData(newData);
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
          
          <div className="md:col-span-2 lg:col-span-2 bg-slate-900 rounded-xl p-6 border border-slate-800">
             <h3 className="text-lg font-bold text-white mb-4">Recent Models</h3>
             <div className="space-y-3">
               {data.models.slice(0, 3).map(m => (
                 <div key={m.id} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setSelectedModel(m)}>
                   <div className="w-12 h-12 bg-slate-700 rounded-md overflow-hidden flex-shrink-0">
                      {m.thumbnailUrl && <img src={m.thumbnailUrl} className="w-full h-full object-cover" />}
                   </div>
                   <div>
                     <div className="font-medium text-slate-200">{m.name}</div>
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
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500"
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
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
  <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-colors">
     <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
     <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">{title}</h3>
     <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);