import React, { useState } from 'react';
import { Search, Package, Grid3x3, List, FileText } from 'lucide-react';

type ViewMode = 'grid' | 'list';

interface Part {
  id: number;
  name: string;
  partNumber: string;
  material: string;
  complexity: 'Low' | 'Medium' | 'High';
  document: string;
}

const Parts: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // TODO: Fetch parts from Supabase
  const mockParts: Part[] = [];

  const getComplexityConfig = (complexity: string) => {
    const configs = {
      Low: {
        className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        borderColor: 'border-l-emerald-500',
      },
      Medium: {
        className: 'bg-yellow-50 text-yellow-700 border-yellow-300',
        borderColor: 'border-l-yellow-500',
      },
      High: {
        className: 'bg-rose-100 text-rose-700 border-rose-300',
        borderColor: 'border-l-rose-500',
      },
    };
    return configs[complexity as keyof typeof configs] || configs.Medium;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Parts</h1>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search parts..."
            className="w-full h-[38px] pl-10 pr-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm"
          />
        </div>
        <select className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm">
          <option>All Complexity</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm">
          <option>All Materials</option>
          <option>Aluminum 6061</option>
          <option>Steel</option>
          <option>Stainless Steel</option>
          <option>Brass</option>
          <option>Rubber</option>
        </select>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-gray-100 text-gray-900'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
            title="Grid view"
          >
            <Grid3x3 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-gray-100 text-gray-900'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Parts List/Grid */}
      {mockParts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5}/>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No parts yet</h3>
          <p className="text-sm text-gray-500">Parts will appear here after processing documents</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {mockParts.map(part => {
          const complexityConfig = getComplexityConfig(part.complexity);

          return viewMode === 'grid' ? (
            // Grid View
            <div
              key={part.id}
              className={`group bg-white border border-gray-200 ${complexityConfig.borderColor} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-4`}
            >
              <div className="flex items-start gap-3 mb-3">
                <Package className="w-10 h-10 text-purple-500 flex-shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 truncate mb-1">{part.name}</h3>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {part.partNumber}
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${complexityConfig.className}`}>
                    {part.complexity}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-sm text-gray-500">
                <div>Material: {part.material}</div>
                <div className="flex items-center gap-1 text-blue-600 text-xs">
                  <FileText className="w-3 h-3" strokeWidth={1.5} />
                  {part.document}
                </div>
              </div>
            </div>
          ) : (
            // List View
            <div
              key={part.id}
              className={`group bg-white border border-gray-200 ${complexityConfig.borderColor} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer py-3 px-4`}
            >
              <div className="flex items-center gap-4">
                <Package className="w-8 h-8 text-purple-500 flex-shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 truncate">{part.name}</h3>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {part.partNumber}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                  <span>Material: {part.material}</span>
                  <span className="flex items-center gap-1 text-blue-600 text-xs">
                    <FileText className="w-3 h-3" strokeWidth={1.5} />
                    {part.document}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${complexityConfig.className}`}>
                  {part.complexity}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default Parts;
