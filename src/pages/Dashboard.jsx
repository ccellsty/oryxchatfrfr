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
  Search 
} from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetchUserGroups();
    fetchFriends();
  }, [user]);

  const fetchUserGroups = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        group_chats (*)
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      setGroups(data.map(item => item.group_chats));
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

    if (!error && data) {
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
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 liquid-glass m-4 rounded-2xl flex flex-col">
        <div className="p-6 border-b border-border-color">
          <h1 className="text-2xl font-bold flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-accent-color" />
            OryxChat
          </h1>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Group
            </button>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">
              GROUP CHATS
            </h3>
            <div className="space-y-1">
              {groups.map(group => (
                <Link
                  key={group.id}
                  to={`/chat/${group.id}`}
                  className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  {group.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">
              FRIENDS
            </h3>
            <div className="space-y-1">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Users className="w-5 h-5 mr-3" />
                  {friend.display_name}
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-border-color">
          <Link
            to="/settings"
            className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors mb-2"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="aero-glass p-8 rounded-2xl h-full flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-24 h-24 text-accent-color mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold mb-4">Welcome to OryxChat</h2>
            <p className="text-text-secondary max-w-md">
              Select a group chat from the sidebar or create a new one to start messaging with your friends.
            </p>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="liquid-glass p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create Group Chat</h3>
            <form onSubmit={createGroup}>
              <input
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="input w-full mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn flex-1"
                >
                  Create
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