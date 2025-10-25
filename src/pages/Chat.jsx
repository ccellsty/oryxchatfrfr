// src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Send, 
  Image as ImageIcon, 
  Users,
  Settings,
  ArrowLeft 
} from 'lucide-react';

const Chat = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
      fetchMessages();
      subscribeToMessages();
    }
  }, [groupId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchGroupData = async () => {
    const { data: groupData } = await supabase
      .from('group_chats')
      .select('*')
      .eq('id', groupId)
      .single();

    const { data: membersData } = await supabase
      .from('group_members')
      .select(`
        role,
        profiles (*)
      `)
      .eq('group_id', groupId);

    setGroup(groupData);
    setMembers(membersData || []);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (username, avatar_url, display_name)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          content: newMessage,
          group_id: groupId,
          sender_id: user.id,
        }
      ]);

    if (!error) {
      setNewMessage('');
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Send message with attachment
      await supabase
        .from('messages')
        .insert([
          {
            content: '',
            group_id: groupId,
            sender_id: user.id,
            attachment_url: publicUrl,
          }
        ]);

    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="liquid-glass m-4 mb-0 rounded-2xl rounded-b-none p-4 border-b border-border-color">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="mr-4">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h2 className="text-xl font-bold">{group?.name}</h2>
                <p className="text-text-secondary text-sm">
                  {members.length} members
                </p>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/5">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`message-bubble ${
                message.sender_id === user.id ? 'message-own' : 'message-other'
              }`}
            >
              {message.sender_id !== user.id && (
                <div className="text-sm font-semibold mb-1">
                  {message.profiles?.display_name || message.profiles?.username}
                </div>
              )}
              {message.content && (
                <div className="text-white">{message.content}</div>
              )}
              {message.attachment_url && (
                <div className="mt-2">
                  <img
                    src={message.attachment_url}
                    alt="Attachment"
                    className="max-w-xs rounded-lg"
                  />
                </div>
              )}
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="liquid-glass m-4 mt-0 rounded-2xl rounded-t-none p-4">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </label>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={uploading || !newMessage.trim()}
              className="btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-80 liquid-glass m-4 rounded-2xl p-4">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Members ({members.length})
        </h3>
        <div className="space-y-2">
          {members.map(member => (
            <div
              key={member.profiles.id}
              className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent-color flex items-center justify-center text-sm font-bold mr-3">
                {member.profiles.display_name?.[0] || member.profiles.username?.[0]}
              </div>
              <div>
                <div className="font-semibold">
                  {member.profiles.display_name || member.profiles.username}
                </div>
                <div className="text-xs text-text-secondary capitalize">
                  {member.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chat;