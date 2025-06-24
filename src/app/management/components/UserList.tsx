import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ROLE_NAMES, type CustomRole } from '@/constants/roles';
import { db } from '@/lib/firebase-client';
import type { AppUser } from '@/types/auth';

export default function UserList() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 載入自訂角色
        const rolesSnapshot = await getDocs(collection(db, 'customRoles'));
        const roles: CustomRole[] = [];
        rolesSnapshot.forEach(doc => {
          roles.push({ id: doc.id, ...doc.data() } as CustomRole);
        });
        setCustomRoles(roles);

        // 載入用戶
        const snap = await getDocs(collection(db, 'members'));
        setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser)));
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setMessage('無法載入用戶列表');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const handleRoleChange = async (uid: string, newRole: string) => {
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

  // 取得角色顯示名稱
  const getRoleDisplayName = (roleId: string): string => {
    // 檢查是否為標準角色
    if (roleId in ROLE_NAMES) {
      return ROLE_NAMES[roleId as keyof typeof ROLE_NAMES];
    }
    
    // 檢查是否為自訂角色
    const customRole = customRoles.find(r => r.id === roleId);
    return customRole ? customRole.name : roleId;
  };

  // 取得所有可用角色選項
  const getRoleOptions = () => {
    const options = [
      { value: 'owner', label: '擁有者' },
      { value: 'guest', label: '訪客' },
    ];
    
    // 加入自訂角色
    customRoles.forEach(role => {
      options.push({ value: role.id, label: role.name });
    });
    
    return options;
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
                <td className='px-4 py-2'>{getRoleDisplayName(user.currentRole || 'guest')}</td>
                <td className='px-4 py-2'>
                  <select
                    value={user.currentRole || 'guest'}
                    onChange={e => void handleRoleChange(user.uid, e.target.value)}
                    disabled={savingId === user.uid}
                    className='border rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                  >
                    {getRoleOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
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