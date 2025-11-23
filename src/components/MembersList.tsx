import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Shield, User, Loader, AlertCircle } from 'lucide-react';
import { RoleEnum } from '../lib/database.types';

interface Member {
  user_id: string;
  role: RoleEnum;
  org_id: string;
}

interface MembersListProps {
  orgId: string;
  currentUserRole: RoleEnum;
  currentUserId: string;
}

const MembersList: React.FC<MembersListProps> = ({
  orgId,
  currentUserRole,
  currentUserId,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        // Get all members for this org
        const { data, error: fetchError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('org_id', orgId);

        if (fetchError) {
          console.error('[MembersList] Fetch error:', fetchError);
          throw fetchError;
        }

        console.log('[MembersList] Loaded members:', data);
        setMembers(data || []);
      } catch (err: any) {
        console.error('[MembersList] Error:', err);
        setError(err.message || 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [orgId]);

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setDeleting(userId);
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', userId);

      if (error) throw error;

      setMembers(members.filter((m) => m.user_id !== userId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: RoleEnum) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('org_id', orgId)
        .eq('user_id', userId);

      if (error) throw error;

      setMembers(
        members.map((m) =>
          m.user_id === userId ? { ...m, role: newRole } : m
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-sm text-gray-500">No members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.user_id}
          className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {member.user_id === currentUserId ? 'You' : 'Member'}
              </p>
              <p className="text-xs text-gray-500">
                ID: {member.user_id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManageMembers && member.user_id !== currentUserId ? (
              <>
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.user_id, e.target.value as RoleEnum)
                  }
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>

                <button
                  onClick={() => handleRemoveMember(member.user_id)}
                  disabled={deleting === member.user_id}
                  className="p-2 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                {member.role === 'owner' && (
                  <Shield className="w-4 h-4 text-amber-600" />
                )}
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {member.role}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MembersList;