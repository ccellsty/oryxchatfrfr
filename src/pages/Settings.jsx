// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Upload, Save, User, Mail, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, profile, session, signOut, refreshProfile } = useAuth();
  const { theme, accentColor, updateThemeSettings } = useTheme();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  // Verify session on component mount
  useEffect(() => {
    const verifySession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setError('Your session has expired. Please sign in again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    
    verifySession();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Verify session before proceeding
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload avatar: ' + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      // Update profile with explicit error handling
      console.log('Updating profile for user:', user.id);
      console.log('Session exists:', !!session);
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          display_name: displayName.trim() || username.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error details:', updateError);
        
        if (updateError.code === '23505') { // Unique constraint violation
          throw new Error('Username already taken. Please choose a different one.');
        } else if (updateError.message.includes('permission denied')) {
          // Try to get more details about the permission error
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          console.log('Current user from auth:', currentUser);
          console.log('Target user ID:', user.id);
          console.log('Are they the same?', currentUser?.id === user.id);
          
          throw new Error(`Permission denied. User ID mismatch or insufficient permissions. Please try signing out and back in.`);
        } else {
          throw new Error(`Update failed: ${updateError.message}`);
        }
      }

      setSuccess('Profile updated successfully!');
      setAvatarFile(null);
      
      // Refresh profile data
      await refreshProfile();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Error signing out: ' + error.message);
    }
  };

  const accentColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
    '#ef4444', '#f59e0b', '#84cc16', '#10b981'
  ];

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      setAvatarFile(file);
      setError('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
        <div className="liquid-glass p-8 rounded-2xl text-center">
          <div className="text-red-400 mb-4">Please sign in to access settings</div>
          <Link to="/login" className="btn">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-bg-primary">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/" className="mr-4 p-2 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>

        {/* Debug Info (remove in production) */}
        <div className="liquid-glass p-4 mb-6 text-xs text-text-secondary rounded-lg border border-border-color">
          <div>User ID: {user?.id}</div>
          <div>Session: {session ? 'Active' : 'Inactive'}</div>
          <div>Profile loaded: {profile ? 'Yes' : 'No'}</div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="liquid-glass p-4 mb-6 text-red-400 rounded-lg border border-red-400/20">
            {error}
          </div>
        )}
        
        {success && (
          <div className="liquid-glass p-4 mb-6 text-green-400 rounded-lg border border-green-400/20">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <div className="liquid-glass p-6 rounded-2xl border border-border-color">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Settings
            </h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium mb-3 text-text-secondary">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-accent-color flex items-center justify-center text-white text-xl font-bold relative overflow-hidden">
                    {avatarFile ? (
                      <img 
                        src={URL.createObjectURL(avatarFile)} 
                        alt="Preview" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (profile?.display_name?.[0] || profile?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="btn btn-secondary cursor-pointer inline-flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {avatarFile ? 'Change Image' : 'Upload Image'}
                    </label>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={() => setAvatarFile(null)}
                        className="block text-sm text-text-secondary hover:text-text-primary mt-2"
                      >
                        Cancel upload
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Recommended: Square image, max 5MB
                </p>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input w-full bg-bg-tertiary/50 cursor-not-allowed"
                  readOnly
                  disabled
                />
                <p className="text-xs text-text-secondary mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input w-full"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  title="Username can only contain letters, numbers, and underscores"
                />
                <p className="text-xs text-text-secondary mt-1">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input w-full"
                  placeholder="Optional display name"
                  maxLength={30}
                />
                <p className="text-xs text-text-secondary mt-1">
                  This is how others will see you. Leave empty to use username.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving || !username.trim()}
                className="btn w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Theme Settings */}
          <div className="liquid-glass p-6 rounded-2xl border border-border-color">
            <h2 className="text-xl font-bold mb-6">Appearance</h2>
            
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-text-secondary">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateThemeSettings('dark', accentColor)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      theme === 'dark' 
                        ? 'border-accent-color bg-accent-color/10' 
                        : 'border-border-color hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold mb-1">Dark</div>
                    <div className="text-sm text-text-secondary">Default dark theme</div>
                  </button>
                  <div
                    className="p-4 rounded-lg border-2 border-border-color text-left opacity-50 cursor-not-allowed"
                  >
                    <div className="font-semibold mb-1">Light</div>
                    <div className="text-sm text-text-secondary">Coming soon</div>
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium mb-3 text-text-secondary">
                  Accent Color
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {accentColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateThemeSettings(theme, color)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        accentColor === color 
                          ? 'border-white scale-110' 
                          : 'border-border-color hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium mb-3 text-text-secondary">
                  Preview
                </label>
                <div className="aero-glass p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: accentColor }}
                    >
                      {profile?.display_name?.[0] || profile?.username?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: accentColor }}>
                        {profile?.display_name || profile?.username || 'Your Name'}
                      </div>
                      <div className="text-sm text-text-secondary">
                        This is how your accent color looks
                      </div>
                    </div>
                  </div>
                  <div 
                    className="text-sm p-3 rounded-lg inline-block"
                    style={{ 
                      backgroundColor: accentColor + '20',
                      border: `1px solid ${accentColor + '40'}`
                    }}
                  >
                    Example message with your accent color
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
