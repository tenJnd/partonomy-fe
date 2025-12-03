import React from "react";
import { AlertTriangle } from "lucide-react";

interface RemovePartFromProjectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  partName: string;
}

const RemovePartFromProjectModal: React.FC<RemovePartFromProjectModalProps> = ({
  open,
  onClose,
  onConfirm,
  partName,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-gray-900">
            Remove part from project?
          </h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This will remove <strong>{partName}</strong> from this project.
          <br />
          The part itself will NOT be deleted.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
          >
            Remove Part
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemovePartFromProjectModal;
