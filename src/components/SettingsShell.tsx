import React from 'react';
import {AlertCircle, CheckCircle} from 'lucide-react';

interface SettingsShellProps {
    title: string;
    description?: string;
    canManageOrg: boolean;
    loading?: boolean;
    saveError?: string;
    saveSuccess?: boolean;
    children: React.ReactNode;
}

const SettingsShell: React.FC<SettingsShellProps> = ({
                                                         title,
                                                         description,
                                                         canManageOrg,
                                                         // loading,
                                                         saveError,
                                                         saveSuccess,
                                                         children,
                                                     }) => {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </div>

            {!canManageOrg && (
                <div className="mb-4 p-4 bg-red-100 border border-gray-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2}/>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            You don&apos;t have permission to manage organization settings.
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Only organization owners and admins can change these settings. Contact your admin if you
                            need access.
                        </p>
                    </div>
                </div>
            )}

            <div className="mb-6 space-y-3">
                {saveError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2}/>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-rose-900">Error</p>
                            <p className="text-sm text-rose-700 mt-1">{saveError}</p>
                        </div>
                    </div>
                )}
                {saveSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2}/>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-emerald-900">
                                Changes saved successfully!
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className={`${!canManageOrg ? 'opacity-60 pointer-events-none' : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default SettingsShell;
