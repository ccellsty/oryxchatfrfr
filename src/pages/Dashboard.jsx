// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  Plus,
  Search,
  UserPlus,
  Shield,
  Crown
} from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserGroups();
      fetchFriends();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        role,
        group_chats (*)
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      setGroups(data.map(item => ({
        ...item.group_chats,
        userRole: item.role
      })));
    }
  };

  const fetchFriends = async () => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        friend:profiles!friends_friend_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (!error && data) {
      setFriends(data.map(item => item.friend));
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_chats')
        .insert([
          {
            name: newGroupName,
            owner_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase
        .from('group_members')
        .insert([
          {
            group_id: data.id,
            user_id: user.id,
            role: 'owner'
          }
        ]);

      setNewGroupName('');
      setShowCreateGroup(false);
      fetchUserGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (e) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    setLoading(true);
    try {
      // Find user by username
      const { data: friendData, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', friendUsername.trim())
        .single();

      if (findError || !friendData) {
        throw new Error('User not found');
      }

      if (friendData.id === user.id) {
        throw new Error('You cannot add yourself as a friend');
      }

      // Check if friend request already exists
      const { data: existingRequest } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendData.id}),and(user_id.eq.${friendData.id},friend_id.eq.${user.id})`)
        .single();

      if (existingRequest) {
        throw new Error('Friend request already exists');
      }

      // Create friend request
      const { error: friendError } = await supabase
        .from('friends')
        .insert([
          {
            user_id: user.id,
            friend_id: friendData.id,
            status: 'pending'
          }
        ]);

      if (friendError) throw friendError;

      setFriendUsername('');
      setShowAddFriend(false);
      alert('Friend request sent!');
      fetchFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Error adding friend: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar */}
      <div className="w-80 liquid-glass m-4 rounded-2xl flex flex-col border border-border-color">
        <div className="p-6 border-b border-border-color">
          <h1 className="text-2xl font-bold flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-accent-color" />
            OryxChat
          </h1>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Quick Actions */}
          <div className="space-y-2 mb-8">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full flex items-center p-3 rounded-lg bg-accent-color text-white hover:bg-accent-color/90 transition-colors"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Group
            </button>
            
            <button
              onClick={() => setShowAddFriend(true)}
              className="w-full flex items-center p-3 rounded-lg bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80 transition-colors border border-border-color"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              Add Friend
            </button>
          </div>

          {/* Group Chats Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              Group Chats ({groups.length})
            </h3>
            <div className="space-y-1">
              {groups.map(group => (
                <Link
                  key={group.id}
                  to={`/chat/${group.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center min-w-0">
                    <MessageSquare className="w-5 h-5 mr-3 text-text-secondary flex-shrink-0" />
                    <span className="truncate">{group.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {getRoleIcon(group.userRole)}
                  </div>
                </Link>
              ))}
              {groups.length === 0 && (
                <div className="text-text-secondary text-sm p-3 text-center">
                  No groups yet. Create one to get started!
                </div>
              )}
            </div>
          </div>

          {/* Friends Section */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              Friends ({friends.length})
            </h3>
            <div className="space-y-1">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-color flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                    {friend.display_name?.[0]?.toUpperCase() || friend.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {friend.display_name || friend.username}
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      @{friend.username}
                    </div>
                  </div>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="text-text-secondary text-sm p-3 text-center">
                  No friends yet. Add some to start chatting!
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border-color">
          <div className="flex items-center space-x-3 mb-4 p-3 rounded-lg bg-bg-tertiary/50">
            <div className="w-10 h-10 rounded-full bg-accent-color flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate text-sm">
                {user?.email}
              </div>
              <div className="text-xs text-text-secondary truncate">
                Online
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <Link
              to="/settings"
              className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors text-text-primary"
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="aero-glass rounded-2xl h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <MessageSquare className="w-24 h-24 text-accent-color mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold mb-4">Welcome to OryxChat</h2>
            <p className="text-text-secondary mb-6">
              {groups.length === 0 
                ? "Create your first group chat or add friends to start messaging."
                : "Select a group chat from the sidebar to start messaging with your friends."
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </button>
              <button
                onClick={() => setShowAddFriend(true)}
                className="btn btn-secondary"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="liquid-glass p-6 rounded-2xl w-full max-w-md border border-border-color">
            <h3 className="text-xl font-bold mb-4">Create Group Chat</h3>
            <form onSubmit={createGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-text-secondary">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="input w-full"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn flex-1"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="liquid-glass p-6 rounded-2xl w-full max-w-md border border-border-color">
            <h3 className="text-xl font-bold mb-4">Add Friend</h3>
            <form onSubmit={addFriend}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-text-secondary">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  className="input w-full"
                  autoFocus
                  required
                />
                <p className="text-xs text-text-secondary mt-2">
                  Enter the exact username of the person you want to add
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddFriend(false)}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn flex-1"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
