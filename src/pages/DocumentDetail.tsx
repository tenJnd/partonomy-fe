import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

const DocumentDetail: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { currentOrg } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partRenderUrl, setPartRenderUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [imageLoading, setImageLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Fetch document and its parts
  useEffect(() => {
    if (!documentId || !currentOrg) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch document
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .eq('org_id', currentOrg.org_id)
          .single();

        if (docError) {
          throw new Error(docError.message);
        }

        if (!docData) {
          throw new Error('Document not found');
        }

        setDocument(docData);

        // Fetch parts connected to this document via document_parts table
        const { data: partsData, error: partsError } = await supabase
          .from('document_parts')
          .select(`
            part_id,
            parts (*)
          `)
          .eq('document_id', documentId);

        if (partsError) {
          console.error('Error fetching parts:', partsError);
        } else if (partsData) {
          const fetchedParts = partsData
            .map(dp => dp.parts)
            .filter((p): p is Part => p !== null);
          setParts(fetchedParts);

          // Auto-select first part if available
          if (fetchedParts.length > 0) {
            setSelectedPartId(fetchedParts[0].id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId, currentOrg]);

  // Fetch part render URL when selected part changes
  useEffect(() => {
    if (!selectedPartId) return;

    const fetchPartRender = async () => {
      setImageLoading(true);
      setPartRenderUrl(null);
      setImageAspectRatio(null);

      const part = parts.find(p => p.id === selectedPartId);
      if (!part?.render_bucket || !part?.render_storage_key) {
        setImageLoading(false);
        return;
      }

      const { data, error } = await supabase.storage
        .from(part.render_bucket)
        .createSignedUrl(part.render_storage_key, 3600); // 1 hour expiry

      if (error) {
        console.error('Error fetching render:', error);
      } else if (data?.signedUrl) {
        setPartRenderUrl(data.signedUrl);

        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          setImageAspectRatio(img.width / img.height);
        };
        img.src = data.signedUrl;
      }

      setImageLoading(false);
    };

    fetchPartRender();
  }, [selectedPartId, parts]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 500));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 100) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 100) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Reset position when zoom changes
  useEffect(() => {
    if (zoom <= 100) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Track container width for aspect ratio calculations
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate container height based on aspect ratio
  const containerHeight = imageAspectRatio && containerWidth
    ? `${containerWidth / imageAspectRatio}px`
    : '600px';

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
            <p className="text-sm text-gray-500 mb-4">
              {error || 'The document you\'re looking for doesn\'t exist.'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Back to Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedPart = parts.find(p => p.id === selectedPartId);

  // Fullscreen modal
  const renderFullscreenModal = () => {
    if (!isFullscreen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
        {/* Fullscreen Controls */}
        <div className="flex items-center justify-between p-4 bg-black/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              {selectedPart?.display_name || selectedPart?.part_number || 'Part Render'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 25}
              className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <span className="text-sm text-white min-w-[4rem] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 300}
              className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Reset zoom"
            >
              <RotateCw className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Exit fullscreen"
            >
              <Minimize2 className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Fullscreen Image */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {partRenderUrl ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <img
                src={partRenderUrl}
                alt="Part render"
                style={{
                  width: `${zoom}%`,
                  height: 'auto',
                  maxWidth: 'none',
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  pointerEvents: 'none'
                }}
                className="transition-transform duration-100"
                draggable={false}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p>No render available</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {renderFullscreenModal()}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{document.file_name}</h1>
          <p className="text-sm text-gray-500">
            {parts.length} {parts.length === 1 ? 'part' : 'parts'} detected
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Part Data (JSON) - Takes 1 column */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 xl:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Part Data</h2>

          {/* Part Selector */}
          {parts.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Part
              </label>
              <select
                value={selectedPartId || ''}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm"
              >
                {parts.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.display_name || part.part_number || part.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* JSON Data Display */}
          {selectedPart ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(selectedPart.report_json, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No parts detected for this document</p>
            </div>
          )}
        </div>

        {/* Right: Part Render with Zoom - Takes 2 columns */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Part Render</h2>

            {/* Zoom Controls */}
            {partRenderUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                  className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                  className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Reset zoom"
                >
                  <RotateCw className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          {/* Image Container */}
          <div
            ref={containerRef}
            className="border border-gray-200 rounded-lg overflow-auto bg-gray-50 relative"
            style={{
              width: '100%',
              height: containerHeight,
              maxHeight: '80vh',
              cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {imageLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={1.5} />
              </div>
            ) : partRenderUrl ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  ref={imageRef}
                  src={partRenderUrl}
                  alt="Part render"
                  style={{
                    width: `${zoom}%`,
                    height: 'auto',
                    maxWidth: 'none',
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    pointerEvents: 'none'
                  }}
                  className="transition-transform duration-100"
                  draggable={false}
                />
              </div>
            ) : selectedPartId ? (
              <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                <div>
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm">No render available for this part</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                <p className="text-sm">Select a part to view its render</p>
              </div>
            )}
          </div>

          {/* Drawing Info Section */}
          {selectedPart?.report_json && (selectedPart.report_json as any)?.drawing_info && (() => {
            const drawingInfo = (selectedPart.report_json as any).drawing_info;
            return (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Drawing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drawingInfo.drawing_number && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Drawing Number</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.drawing_number}</dd>
                    </div>
                  )}
                  {drawingInfo.drawing_title && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Title</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.drawing_title}</dd>
                    </div>
                  )}
                  {drawingInfo.part_number && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Part Number</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.part_number}</dd>
                    </div>
                  )}
                  {drawingInfo.revision && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Revision</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.revision}</dd>
                    </div>
                  )}
                  {drawingInfo.date && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.date}</dd>
                    </div>
                  )}
                  {drawingInfo.revision_date && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Revision Date</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.revision_date}</dd>
                    </div>
                  )}
                  {drawingInfo.scale && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Scale</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.scale}</dd>
                    </div>
                  )}
                  {drawingInfo.base_unit && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Units</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.base_unit}</dd>
                    </div>
                  )}
                  {drawingInfo.author && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Author</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.author}</dd>
                    </div>
                  )}
                  {drawingInfo.checker && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Checker</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.checker}</dd>
                    </div>
                  )}
                  {drawingInfo.approver && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Approver</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.approver}</dd>
                    </div>
                  )}
                  {drawingInfo.sheet_info && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Sheet</dt>
                      <dd className="text-sm text-gray-900">
                        {drawingInfo.sheet_info.sheet} of {drawingInfo.sheet_info.total_sheets}
                      </dd>
                    </div>
                  )}
                  {drawingInfo.projection_type && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Projection Type</dt>
                      <dd className="text-sm text-gray-900 capitalize">{drawingInfo.projection_type}</dd>
                    </div>
                  )}
                  {drawingInfo.company_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Company</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.company_name}</dd>
                    </div>
                  )}
                  {drawingInfo.project_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Project</dt>
                      <dd className="text-sm text-gray-900">{drawingInfo.project_name}</dd>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Overview Section */}
          {selectedPart?.report_json && (selectedPart.report_json as any)?.overview && (() => {
            const overview = (selectedPart.report_json as any).overview;
            const drawingInfo = (selectedPart.report_json as any)?.drawing_info;

            return (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {/* Description Section */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Part description</h3>
                  <div className="space-y-3">
                    {drawingInfo?.part_type_desc && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</dt>
                        <dd className="text-sm text-gray-900">{drawingInfo.part_type_desc}</dd>
                      </div>
                    )}
                    {overview.part_type && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Part Type</dt>
                        <dd className="text-sm text-gray-900">{overview.part_type}</dd>
                      </div>
                    )}
                    {overview.taxonomy?.application_hint && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Application</dt>
                        <dd className="text-sm text-gray-900">{overview.taxonomy.application_hint}</dd>
                      </div>
                    )}
                  </div>
                </div>

                {/* Material and Blank Dimensions - Two Columns */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Material */}
                    {overview.material && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Material</h3>
                        <div className="space-y-3">
                          {overview.material.text && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Text</dt>
                              <dd className="text-sm text-gray-900">{overview.material.text}</dd>
                            </div>
                          )}
                          {overview.material.value && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Value</dt>
                              <dd className="text-sm text-gray-900">{overview.material.value}</dd>
                            </div>
                          )}
                          {overview.material.confidence !== undefined && overview.material.confidence !== null && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Confidence</dt>
                              <dd className="text-sm text-gray-900">{(overview.material.confidence * 100).toFixed(0)}%</dd>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Blank Dimensions */}
                    {overview.blank_dimensions && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Blank Dimensions</h3>
                        <div className="space-y-3">
                          {overview.blank_dimensions.text && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Dimensions</dt>
                              <dd className="text-sm text-gray-900">{overview.blank_dimensions.text}</dd>
                            </div>
                          )}
                          {overview.blank_dimensions.text_norm && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Note</dt>
                              <dd className="text-sm text-gray-900">{overview.blank_dimensions.text_norm}</dd>
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2">
                            {overview.blank_dimensions.unit && (
                              <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Unit</dt>
                                <dd className="text-sm text-gray-900">{overview.blank_dimensions.unit}</dd>
                              </div>
                            )}
                            {overview.blank_dimensions.source && (
                              <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Source</dt>
                                <dd className="text-sm text-gray-900">{overview.blank_dimensions.source}</dd>
                              </div>
                            )}
                            {overview.blank_dimensions.confidence !== undefined && overview.blank_dimensions.confidence !== null && (
                              <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Confidence</dt>
                                <dd className="text-sm text-gray-900">{(overview.blank_dimensions.confidence * 100).toFixed(0)}%</dd>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Taxonomy Section */}
                {overview.taxonomy && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxonomy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {overview.taxonomy.primary_class && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Primary Class</dt>
                          <dd className="text-sm text-gray-900 capitalize">{overview.taxonomy.primary_class.toLowerCase().replace(/_/g, ' ')}</dd>
                        </div>
                      )}
                      {overview.taxonomy.secondary_class && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Secondary Class</dt>
                          <dd className="text-sm text-gray-900 capitalize">{overview.taxonomy.secondary_class.toLowerCase().replace(/_/g, ' ')}</dd>
                        </div>
                      )}
                      {overview.taxonomy.process_family && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Process Family</dt>
                          <dd className="text-sm text-gray-900 capitalize">{overview.taxonomy.process_family.toLowerCase().replace(/_/g, ' ')}</dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
