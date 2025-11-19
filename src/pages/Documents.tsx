import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {CheckCircle, FileText, Grid3x3, List, Loader, Search, Upload, XCircle} from 'lucide-react';

type ViewMode = 'grid' | 'list';

const Documents: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const navigate = useNavigate();

    // TODO: Fetch documents from Supabase
    const displayDocuments: any[] = [];

    const getStatusConfig = (status: string) => {
        const configs = {
            processed: {
                icon: CheckCircle,
                className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
                label: 'Processed',
                borderColor: 'border-l-blue-500',
            },
            processing: {
                icon: Loader,
                className: 'bg-yellow-50 text-yellow-700 border-yellow-300 animate-pulse',
                label: 'Processing',
                borderColor: 'border-l-yellow-500',
            },
            error: {
                icon: XCircle,
                className: 'bg-rose-100 text-rose-700 border-rose-300',
                label: 'Error',
                borderColor: 'border-l-rose-500',
            },
        };
        return configs[status as keyof typeof configs] || configs.processed;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all active:scale-[0.98]">
                    <Upload className="w-4 h-4" strokeWidth={1.5}/>
                    <span className="text-sm font-medium">Upload Document</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            strokeWidth={1.5}/>
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-full h-[38px] pl-10 pr-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm"
                    />
                </div>
                <select
                    className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm">
                    <option>All Status</option>
                    <option>Processed</option>
                    <option>Processing</option>
                    <option>Error</option>
                </select>
                <select
                    className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm">
                    <option>All Time</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
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
                        <Grid3x3 className="w-4 h-4" strokeWidth={1.5}/>
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
                        <List className="w-4 h-4" strokeWidth={1.5}/>
                    </button>
                </div>
            </div>

            {/* Documents List/Grid */}
            {displayDocuments.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5}/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                    <p className="text-sm text-gray-500 mb-6">Upload your first document to get started</p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all">
                        <Upload className="w-4 h-4" strokeWidth={1.5}/>
                        <span className="text-sm font-medium">Upload Document</span>
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                    {displayDocuments.map(doc => {
                    const statusConfig = getStatusConfig(doc.status);
                    const StatusIcon = statusConfig.icon;

                    return viewMode === 'grid' ? (
                        // Grid View
                        <div
                            key={doc.id}
                            className={`group bg-white border border-gray-200 ${statusConfig.borderColor} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-4`}
                            onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <FileText className="w-10 h-10 text-blue-500 flex-shrink-0" strokeWidth={1.5}/>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-medium text-gray-900 truncate mb-1">{doc.name}</h3>
                                    <div
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${statusConfig.className}`}>
                                        <StatusIcon className="w-3 h-3" strokeWidth={2}/>
                                        {statusConfig.label}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-gray-500">
                                <div>Parts: {doc.parts}</div>
                                <div>Uploaded: {doc.uploadedAt}</div>
                            </div>
                        </div>
                    ) : (
                        // List View
                        <div
                            key={doc.id}
                            className={`group bg-white border border-gray-200 ${statusConfig.borderColor} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer py-3 px-4`}
                            onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                            <div className="flex items-center gap-4">
                                <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" strokeWidth={1.5}/>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-medium text-gray-900 truncate">{doc.name}</h3>
                                </div>
                                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                                    <span>Parts: {doc.parts}</span>
                                    <span>Uploaded: {doc.uploadedAt}</span>
                                </div>
                                <div
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${statusConfig.className}`}>
                                    <StatusIcon className="w-3 h-3" strokeWidth={2}/>
                                    {statusConfig.label}
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

export default Documents;
