// src/components/FriendRequests.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserCheck, UserX, Clock } from 'lucide-react';

const FriendRequests = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        user:profiles!friends_user_id_fkey(*)
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (!error && data) {
      setPendingRequests(data);
    }
  };

  const handleFriendRequest = async (requestId, action) => {
    setLoading(true);
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('id', requestId);

        if (error) throw error;
      } else if (action === 'reject') {
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('id', requestId);

        if (error) throw error;
      }

      // Refresh the list
      await fetchPendingRequests();
    } catch (error) {
      console.error('Error handling friend request:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (pendingRequests.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider flex items-center">
        <Clock className="w-4 h-4 mr-2" />
        Friend Requests ({pendingRequests.length})
      </h3>
      <div className="space-y-2">
        {pendingRequests.map(request => (
          <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50 border border-border-color">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-accent-color flex items-center justify-center text-sm font-bold mr-3">
                {request.user?.display_name?.[0]?.toUpperCase() || request.user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {request.user?.display_name || request.user?.username}
                </div>
                <div className="text-xs text-text-secondary">
                  @{request.user?.username}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleFriendRequest(request.id, 'accept')}
                disabled={loading}
                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                title="Accept"
              >
                <UserCheck className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFriendRequest(request.id, 'reject')}
                disabled={loading}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Reject"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequests;
