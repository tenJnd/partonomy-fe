import React from "react";
import {AlertTriangle, Trash2} from "lucide-react";
import {useTranslation} from 'react-i18next';

interface DeleteDocumentModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    documentName: string;
}

const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({
                                                                     open,
                                                                     onClose,
                                                                     onConfirm,
                                                                     documentName,
                                                                 }) => {
    const {t} = useTranslation();
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="w-8 h-8 text-rose-600"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {t('modals.deleteDocument.title')}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {t('modals.deleteDocument.aboutToDelete')} <strong>{documentName}</strong>.
                        </p>
                    </div>
                </div>

                {/* Warning Box */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 mb-6">
                    <p className="font-medium">{t('modals.deleteDocument.permanentWarning')}</p>
                    <p className="mt-1">
                        {t('modals.deleteDocument.associatedPartsWarning')}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
                    >
                        {t('modals.deleteDocument.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4"/>
                        {t('modals.deleteDocument.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteDocumentModal;
