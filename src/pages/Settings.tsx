import React, { useState } from 'react';
import { Building2, Users, CreditCard, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const { currentOrg } = useAuth();
  const [orgName, setOrgName] = useState(currentOrg?.organization.name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSaveOrgName = async () => {
    if (!currentOrg || !orgName.trim()) return;

    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const { error } = await supabase
      .from('organizations')
      .update({ name: orgName.trim() })
      .eq('id', currentOrg.org_id);

    setSaving(false);

    if (error) {
      setSaveError(error.message);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Refresh the page to update org name in TopBar
      window.location.reload();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">

        {/* Organization Settings */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
            <p className="text-sm text-gray-500 mt-1">Manage organization details and preferences</p>
          </div>
          <div className="p-6 space-y-4">
            {saveError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-rose-900">Error</p>
                  <p className="text-sm text-rose-700 mt-1">{saveError}</p>
                </div>
              </div>
            )}
            {saveSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-900">Saved successfully!</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                <div>
                  <div className="text-sm font-medium text-gray-900">Organization Name</div>
                  <div className="text-xs text-gray-500">Update your organization name</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm min-w-[200px]"
                  placeholder="Organization name"
                />
                <button
                  onClick={handleSaveOrgName}
                  disabled={saving || !orgName.trim() || orgName === currentOrg?.organization.name}
                  className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" strokeWidth={2} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Members Settings */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Members</h2>
            <p className="text-sm text-gray-500 mt-1">Manage team members and permissions</p>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-500 mb-4">Team member management coming soon</p>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 text-sm font-medium text-gray-700 transition-all active:scale-[0.98]">
                Invite Member
              </button>
            </div>
          </div>
        </div>

        {/* Billing Settings */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
            <p className="text-sm text-gray-500 mt-1">Manage subscription and billing information</p>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-3">
                <CreditCard className="w-4 h-4" strokeWidth={1.5} />
                Starter Plan
              </div>
              <p className="text-sm text-gray-500 mb-4">Current plan includes basic features</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-all active:scale-[0.98]">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
