import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, KeyRound, ShieldCheck, ShieldOff, Trash2, RefreshCw, Users } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import {
  getLecturerCodes,
  createLecturerCode,
  setCodeActive,
  deleteLecturerCode,
  generateCode,
  listUsers,
  deleteUsers,
} from '../services/adminService';
import styles from './AdminScreen.module.css';

export default function AdminScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Users tab: cleanup for test accounts. Deletion is permanent and
  // frees the email address for re-registration.
  const [tab, setTab] = useState('codes');
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  const USERS_PAGE_SIZE = 20;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.role !== 'admin') {
          navigate('/dashboard', { replace: true });
        } else {
          setChecking(false);
          loadCodes();
        }
      });
  }, [user, navigate]);

  const loadCodes = async () => {
    try {
      setCodes(await getLecturerCodes());
    } catch (err) {
      console.error(err);
      setError('Failed to load codes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const code = newCode.trim();
    if (!code) return;
    setBusy(true);
    setError('');
    try {
      await createLecturerCode(code, newLabel);
      setCreateOpen(false);
      setNewCode('');
      setNewLabel('');
      await loadCodes();
    } catch (err) {
      setError(err.message?.includes('duplicate') ? 'That code already exists.' : 'Failed to create code.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (codeRow) => {
    try {
      await setCodeActive(codeRow.id, !codeRow.active);
      await loadCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (codeRow) => {
    if (codeRow.used_by) return;
    try {
      await deleteLecturerCode(codeRow.id);
      await loadCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const statusFor = (c) => {
    if (c.used_by) return { text: `Used by ${c.used_by_profile?.name ?? 'lecturer'}`, cls: styles.badgeUsed };
    if (!c.active) return { text: 'Inactive', cls: styles.badgeInactive };
    return { text: 'Available', cls: styles.badgeAvailable };
  };

  const loadUsers = async (page, q, role) => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const { users: list, total } = await listUsers({ q, role, page });
      setUsers(list);
      setUsersTotal(total);
    } catch (err) {
      console.error(err);
      setUsersError(err.message || 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (checking || tab !== 'users') return;
    loadUsers(usersPage, query, roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, checking]);

  useEffect(() => {
    if (!deleteOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDeleteOpen(false);
        setConfirmText('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteOpen]);

  const applyUserFilter = () => {
    setUsersPage(1);
    setSelected({});
    loadUsers(1, query, roleFilter);
  };

  const changeUserPage = (next) => {
    setUsersPage(next);
    setSelected({});
    loadUsers(next, query, roleFilter);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allSelected = users.length > 0 && users.every((u) => prev[u.id]);
      if (allSelected) return {};
      const next = { ...prev };
      users.forEach((u) => {
        if (u.id !== user?.id) next[u.id] = true;
      });
      return next;
    });
  };

  const selectedIds = Object.keys(selected);
  const selectedUsers = users.filter((u) => selected[u.id]);
  const totalPages = Math.max(1, Math.ceil(usersTotal / USERS_PAGE_SIZE));

  const confirmDeleteUsers = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return;
    setDeleting(true);
    setDeleteResult(null);
    try {
      const result = await deleteUsers(selectedIds);
      setDeleteResult(result);
      setSelected({});
      setConfirmText('');
      await loadUsers(usersPage, query, roleFilter);
    } catch (err) {
      console.error(err);
      setDeleteResult({ ok: [], failed: [{ id: '', reason: err.message || 'Delete failed.' }] });
    } finally {
      setDeleting(false);
    }
  };

  if (checking) {
    return (
      <div className={styles.container}><div className={styles.center}><div className={styles.spinner} /></div></div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        {tab === 'codes' && (
          <button
            className={styles.newBtn}
            onClick={() => { setNewCode(generateCode()); setNewLabel(''); setCreateOpen(true); }}
          >
            <Plus size={18} color="#FFFFFF" />
            <span>New Code</span>
          </button>
        )}
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Admin sections">
        <button
          role="tab"
          aria-selected={tab === 'codes'}
          className={`${styles.tab} ${tab === 'codes' ? styles.tabActive : ''}`}
          onClick={() => setTab('codes')}
        >
          <KeyRound size={16} />
          <span>Codes</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'users'}
          className={`${styles.tab} ${tab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setTab('users')}
        >
          <Users size={16} />
          <span>Users</span>
        </button>
      </div>

      {tab === 'codes' && (
      <div className={styles.scroll}>
        <h2 className={styles.pageTitle}>Lecturer Codes</h2>
        <p className={styles.pageSub}>Single-use codes. One code verifies one lecturer.</p>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : codes.length === 0 ? (
          <div className={styles.empty}>
            <KeyRound size={32} color="var(--color-text-secondary)" />
            <span className={styles.emptyText}>No codes yet. Create one to invite a lecturer.</span>
          </div>
        ) : (
          codes.map((c) => {
            const status = statusFor(c);
            return (
              <div key={c.id} className={styles.card}>
                <div className={styles.codeRow}>
                  <div className={styles.codeInfo}>
                    <span className={styles.codeText}>{c.code}</span>
                    {c.label && <span className={styles.codeLabel}>{c.label}</span>}
                    <span className={`${styles.badge} ${status.cls}`}>{status.text}</span>
                  </div>
                  <div className={styles.codeActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => handleToggle(c)}
                      title={c.active ? 'Deactivate' : 'Reactivate'}
                      disabled={!!c.used_by}
                    >
                      {c.active ? <ShieldOff size={18} color="var(--color-text-secondary)" /> : <ShieldCheck size={18} color="var(--color-success)" />}
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={() => handleDelete(c)}
                      title="Delete"
                      disabled={!!c.used_by}
                    >
                      <Trash2 size={18} color="var(--color-error)" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {tab === 'users' && (
      <div className={styles.scroll}>
        <h2 className={styles.pageTitle}>Users</h2>
        <p className={styles.pageSub}>
          Tick test accounts to remove them for good. Deletion frees the email
          address so it can register again. This cannot be undone.
        </p>

        <div className={styles.searchRow}>
          <input
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyUserFilter(); }}
            placeholder="Search email, name, username"
            aria-label="Search users"
          />
          <select
            className={styles.roleSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="lecturer">Lecturers</option>
            <option value="admin">Admins</option>
          </select>
          <button className={styles.submitBtn} onClick={applyUserFilter} disabled={usersLoading}>
            Search
          </button>
        </div>

        {usersError && <p className={styles.errorText} role="alert">{usersError}</p>}

        {usersLoading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>
            <Users size={32} color="var(--color-text-secondary)" />
            <span className={styles.emptyText}>
              {usersError
                ? 'Could not load users. The server key may be missing.'
                : 'No users match this search.'}
            </span>
          </div>
        ) : (
          <>
            <label className={styles.selectAllRow}>
              <input
                type="checkbox"
                checked={users.length > 0 && users.every((u) => selected[u.id])}
                onChange={toggleSelectAll}
              />
              <span>Select all on this page ({usersTotal} total)</span>
            </label>
            {users.map((u) => {
              const isSelf = u.id === user?.id;
              const role = u.profile?.role || 'student (no profile)';
              return (
                <label key={u.id} className={styles.card}>
                  <div className={styles.userRow}>
                    <input
                      type="checkbox"
                      className={styles.userCheck}
                      checked={!!selected[u.id]}
                      onChange={() => toggleSelect(u.id)}
                      disabled={isSelf}
                      aria-label={`Select ${u.email}`}
                    />
                    <div className={styles.userMain}>
                      <span className={styles.codeText}>{u.profile?.name || u.email}</span>
                      <span className={styles.codeLabel}>{u.email}</span>
                      <span className={styles.userMeta}>
                        {u.profile?.username ? `@${u.profile.username} ` : ''}
                        {role}{isSelf ? ' (this is you)' : ''}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
            <div className={styles.pager}>
              <button
                className={styles.pagerBtn}
                onClick={() => changeUserPage(usersPage - 1)}
                disabled={usersPage <= 1 || usersLoading}
              >
                Previous
              </button>
              <span className={styles.pagerText}>Page {usersPage} of {totalPages}</span>
              <button
                className={styles.pagerBtn}
                onClick={() => changeUserPage(usersPage + 1)}
                disabled={usersPage >= totalPages || usersLoading}
              >
                Next
              </button>
            </div>
          </>
        )}

        {selectedIds.length > 0 && (
          <button
            className={styles.deleteBtn}
            onClick={() => { setDeleteResult(null); setConfirmText(''); setDeleteOpen(true); }}
          >
            <Trash2 size={18} color="#FFFFFF" />
            <span>Delete {selectedIds.length} user{selectedIds.length > 1 ? 's' : ''}</span>
          </button>
        )}
      </div>
      )}

      {deleteOpen && (
        <div className={styles.modalOverlay} onClick={() => setDeleteOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm user deletion"
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}?</h3>
              <button className={styles.modalClose} onClick={() => setDeleteOpen(false)} aria-label="Close">
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            <div className={styles.formBody}>
              <p className={styles.pageSub}>
                These accounts and all their data will be gone for good. Their
                email addresses can register again afterwards.
              </p>
              <div className={styles.deleteList}>
                {selectedUsers.map((u) => (
                  <span key={u.id} className={styles.codeLabel}>{u.email}</span>
                ))}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="admin-delete-confirm">
                  Type DELETE to confirm
                </label>
                <input
                  id="admin-delete-confirm"
                  className={styles.input}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </div>
              {deleteResult && (
                <div role="status">
                  {deleteResult.ok.length > 0 && (
                    <p className={styles.codeLabel}>Removed: {deleteResult.ok.map((r) => r.email || r.id).join(', ')}</p>
                  )}
                  {deleteResult.failed.map((f, i) => (
                    <p key={i} className={styles.errorText}>
                      {f.id ? `${f.id}: ` : ''}{f.reason}
                    </p>
                  ))}
                </div>
              )}
              <button
                className={styles.deleteBtn}
                onClick={confirmDeleteUsers}
                disabled={deleting || confirmText.trim().toUpperCase() !== 'DELETE'}
              >
                {deleting ? 'Deleting...' : `Delete ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} for good`}
              </button>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className={styles.modalOverlay} onClick={() => setCreateOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>New Lecturer Code</h3>
              <button className={styles.modalClose} onClick={() => setCreateOpen(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            <div className={styles.formBody}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Code</label>
                <div className={styles.codeInputRow}>
                  <input
                    className={styles.input}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="SKOR-XXXXXXXX"
                    autoCapitalize="characters"
                  />
                  <button
                    className={styles.regenerateBtn}
                    onClick={() => setNewCode(generateCode())}
                    title="Generate new"
                  >
                    <RefreshCw size={16} color="var(--color-text-primary)" />
                  </button>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Label (optional)</label>
                <input
                  className={styles.input}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. For Dr. Ahmad"
                />
              </div>
              {error && <p className={styles.errorText}>{error}</p>}
              <button className={styles.submitBtn} onClick={handleCreate} disabled={busy || !newCode.trim()}>
                {busy ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
