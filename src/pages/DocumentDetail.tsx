import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const DocumentDetail: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();

  // TODO: Fetch document from Supabase using documentId

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-sm text-gray-500 mb-4">
            {documentId ? 'The document you\'re looking for doesn\'t exist.' : 'No document ID provided.'}
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
};

export default DocumentDetail;
