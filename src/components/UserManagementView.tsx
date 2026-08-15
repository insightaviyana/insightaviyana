import React, { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, X, Save, ShieldCheck, Briefcase, Eye, Loader2 } from 'lucide-react';
import { User, UserRole, AccountType } from '../types';
import { fetchAllProfiles, adminUpdateProfile, getAccessToken } from '../lib/supabaseAuth';
import { isSupabaseConfigured } from '../lib/supabase';
import { logActivity } from '../lib/activityLogApi';

interface UserManagementViewProps {
  currentUser: User;
}

const STAFF_ROLES: { value: UserRole; label: string }[] = [
  { value: 'IT_LEAD', label: 'IT Lead / Technical Architect' },
  { value: 'STORY_HUNTER', label: 'Story Hunter / Media Crew' },
  { value: 'SOCIAL_MANAGER', label: 'Social & Review Manager' },
  { value: 'GUEST_COORDINATOR', label: 'Guest & Influencer Coordinator' },
  { value: 'HOTEL_SCHOOL_CREW', label: 'Hotel School Crew (Trainee)' }
];

const accountTypeBadge: Record<AccountType, { label: string; className: string; icon: React.ComponentType<{ size?: number }> }> = {
  admin: { label: 'Admin', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: ShieldCheck },
  staff: { label: 'Staff', className: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Briefcase },
  guest: { label: 'Guest Reader', className: 'bg-slate-700/50 text-slate-300 border-slate-600', icon: Eye }
};

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAccountType, setFormAccountType] = useState<AccountType>('staff');
  const [formStaffRole, setFormStaffRole] = useState<UserRole>('STORY_HUNTER');
  const [formTitle, setFormTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchAllProfiles();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormAccountType('staff');
    setFormStaffRole('STORY_HUNTER');
    setFormTitle('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormAccountType(u.accountType);
    setFormStaffRole(u.role);
    setFormTitle(u.title);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (editingUser) {
      // Editing an existing account is just a profiles table update (RLS allows admins to update any profile).
      const errMsg = await adminUpdateProfile(editingUser.id, {
        name: formName,
        accountType: formAccountType,
        staffRole: formAccountType === 'guest' ? null : formStaffRole,
        title: formTitle
      });
      if (errMsg) {
        setFormError(errMsg);
      } else {
        logActivity({ actorId: currentUser.id, actorName: currentUser.name, actorRole: currentUser.role, action: 'edited', targetType: 'User Account', targetTitle: formName });
        setModalOpen(false);
        loadUsers();
      }
    } else {
      // Creating a new staff/admin account requires the service_role key, so this
      // goes through a Netlify Function rather than the browser's Supabase client.
      const token = await getAccessToken();
      if (!token) {
        setFormError('Your session has expired — please sign in again.');
        setSubmitting(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            name: formName,
            accountType: formAccountType,
            staffRole: formAccountType === 'guest' ? null : formStaffRole,
            title: formTitle
          })
        });
        // A Netlify Function that isn't actually deployed (e.g. the site was
        // published via drag-and-drop instead of a git-connected deploy —
        // see PROJECT_HANDOFF.md) returns Netlify's HTML "Page not found"
        // page, not JSON. res.json() would throw on that, so check first
        // and give a specific, actionable message instead of a generic one.
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          setFormError(`Server returned an unexpected response (status ${res.status}, not JSON). This usually means the admin-create-user Netlify Function isn't actually deployed — check Netlify → Site → Functions, and make sure this was deployed via git push, not a drag-and-drop upload.`);
          setSubmitting(false);
          return;
        }
        const json = await res.json();
        if (!res.ok) {
          setFormError(json.error || 'Failed to create account.');
        } else {
          logActivity({ actorId: currentUser.id, actorName: currentUser.name, actorRole: currentUser.role, action: 'created', targetType: 'User Account', targetTitle: formName, detail: `${formAccountType}${formStaffRole ? ' / ' + formStaffRole : ''}` });
          setModalOpen(false);
          loadUsers();
        }
      } catch (err: any) {
        setFormError(`Could not reach the server function (${err?.message || 'network error'}). Is this deployed on Netlify with SUPABASE_SERVICE_ROLE_KEY set, and were the Functions actually deployed (git push, not drag-and-drop)?`);
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser.id) {
      alert("You can't delete your own account while signed in.");
      return;
    }
    if (!window.confirm(`Delete account for ${u.name} (${u.email})? This cannot be undone.`)) return;

    const token = await getAccessToken();
    if (!token) {
      alert('Your session has expired — please sign in again.');
      return;
    }
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: u.id })
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        alert(`Server returned an unexpected response (status ${res.status}, not JSON). The admin-delete-user Netlify Function is likely not deployed — check Netlify → Site → Functions, and redeploy via git push (not drag-and-drop).`);
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to delete account.');
      } else {
        logActivity({ actorId: currentUser.id, actorName: currentUser.name, actorRole: currentUser.role, action: 'deleted', targetType: 'User Account', targetTitle: `${u.name} (${u.email})` });
        loadUsers();
      }
    } catch (err: any) {
      alert(`Could not reach the server function (${err?.message || 'network error'}).`);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-center">
        <Users size={32} className="mx-auto text-amber-400 mb-3" />
        <h3 className="text-white font-bold mb-1">User Management needs Supabase</h3>
        <p className="text-sm text-slate-300">
          Real accounts, roles, and login are stored in Supabase. Connect it (see the SQL setup) to manage users here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-amber-400" />
            User Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Add, edit, and remove admin, staff, and guest accounts.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg"
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={22} className="animate-spin mr-2" /> Loading accounts...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">No accounts found yet.</div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-mono">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Account Type</th>
                <th className="text-left px-4 py-3">Staff Role</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(u => {
                const badge = accountTypeBadge[u.accountType];
                const BadgeIcon = badge.icon;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-2.5">
                      <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                      <span className="font-semibold text-white">{u.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${badge.className}`}>
                        <BadgeIcon size={11} /> {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {u.accountType === 'guest' ? '—' : u.role.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition-all"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser.id}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title={u.id === currentUser.id ? "Can't delete your own account" : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
              <h3 className="font-serif font-bold text-lg text-white">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3 flex-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email</label>
                <input
                  required
                  type="email"
                  disabled={!!editingUser}
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white disabled:opacity-50"
                />
                {editingUser && <p className="text-[10px] text-slate-500 mt-1">Email can't be changed here.</p>}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Temporary Password</label>
                  <input required type="text" minLength={6} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Min. 6 characters" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Account Type</label>
                <select value={formAccountType} onChange={e => setFormAccountType(e.target.value as AccountType)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                  <option value="admin">Admin — full access + user management</option>
                  <option value="staff">Staff — role-based tab access</option>
                  <option value="guest">Guest Reader — public tabs only</option>
                </select>
              </div>

              {formAccountType !== 'guest' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Staff Role (which tabs they can see)</label>
                  <select value={formStaffRole} onChange={e => setFormStaffRole(e.target.value as UserRole)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                    {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Title (shown on profile)</label>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Front Office Manager" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>

              {formError && (
                <div className="p-2.5 bg-red-950/50 border border-red-500/40 rounded-lg text-xs text-red-300">{formError}</div>
              )}

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-60">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{editingUser ? 'Save Changes' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
