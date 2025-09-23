import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import * as api from '../Api';

interface AllUsersProps {
  onGoBack: () => void;
}

const AllUsers: React.FC<AllUsersProps> = ({ onGoBack }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || undefined;
        console.log('Token for getAllUsers:', token);
        const res = await api.getAllUsers(token || undefined);
        // backend returns { success, message, users }
        if (res && res.users) {
          setUsers(res.users);
        } else if (res && res.message) {
          setError(res.message || 'Failed to fetch users');
        } else {
          setError('Failed to fetch users');
        }
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-800">
        <button onClick={onGoBack} className="mb-6 flex items-center text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>

        <h2 className="text-3xl font-semibold mb-6 text-white">All Registered Users</h2>

        {loading && <p className="text-gray-400">Loading users...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((u) => (
              <div
                key={u._id}
                className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-800 transform transition-transform duration-300 hover:-translate-y-2 hover:scale-102 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold">
                    {u.firstName?.[0] || 'U'}{u.lastName?.[0] || ''}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{u.firstName} {u.lastName}</p>
                    <p className="text-sm text-gray-400">{u.email}</p>
                  </div>
                </div>

                <div className="text-sm text-gray-300 space-y-1">
                  <p>Mobile: <span className="text-gray-200">{u.mobile}</span></p>
                  <p>Login ID: <span className="text-gray-200">{u.loginId}</span></p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button className="text-sm text-blue-400 hover:text-blue-300">Message</button>
                  <div className="text-xs text-gray-500">Registered: {new Date(u.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-gray-400">No users found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsers;
