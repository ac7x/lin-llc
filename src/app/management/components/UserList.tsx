import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ROLE_NAMES, type RoleKey } from '@/constants/roles';
import { db } from '@/lib/firebase-client';
import type { AppUser } from '@/types/auth';

export default function UserList() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, 'members'));
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser)));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (uid: string, newRole: RoleKey) => {
    setSavingId(uid);
    setMessage('');
    try {
      await updateDoc(doc(db, 'members', uid), { currentRole: newRole });
      setUsers(users => users.map(u => u.uid === uid ? { ...u, currentRole: newRole } : u));
      setMessage('角色已更新');
    } catch {
      setMessage('更新失敗');
    }
    setSavingId(null);
  };

  if (loading) return <div className='p-4'>載入中...</div>;

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8'>
      <h2 className='text-xl font-bold mb-4'>用戶清單</h2>
      {message && <div className='mb-2 text-blue-600 dark:text-blue-400'>{message}</div>}
      <div className='overflow-x-auto'>
        <table className='min-w-full border-collapse'>
          <thead>
            <tr className='bg-gray-50 dark:bg-gray-900'>
              <th className='px-4 py-2 text-left'>姓名</th>
              <th className='px-4 py-2 text-left'>Email</th>
              <th className='px-4 py-2 text-left'>目前角色</th>
              <th className='px-4 py-2 text-left'>切換角色</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid} className='border-b border-gray-200 dark:border-gray-700'>
                <td className='px-4 py-2'>{user.displayName || '-'}</td>
                <td className='px-4 py-2'>{user.email || '-'}</td>
                <td className='px-4 py-2'>{ROLE_NAMES[user.currentRole as RoleKey] || user.currentRole}</td>
                <td className='px-4 py-2'>
                  <select
                    value={user.currentRole}
                    onChange={e => handleRoleChange(user.uid, e.target.value as RoleKey)}
                    disabled={savingId === user.uid}
                    className='border rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                  >
                    {Object.entries(ROLE_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 