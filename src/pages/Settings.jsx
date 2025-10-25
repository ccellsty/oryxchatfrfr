// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const { user } = useAuth();
  const { theme, accentColor, updateThemeSettings } = useTheme();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setUsername(data.username);
      setDisplayName(data.display_name || '');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const accentColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
    '#ef4444', '#f59e0b', '#84cc16', '#10b981'
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/" className="mr-4 p-2 rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <div className="liquid-glass p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-accent-color flex items-center justify-center text-white text-xl font-bold">
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
                      username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files[0])}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="btn btn-secondary cursor-pointer inline-flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </label>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input w-full"
                  placeholder="Optional display name"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn w-full flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Theme Settings */}
          <div className="liquid-glass p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Appearance</h2>
            
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
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
                  <button
                    onClick={() => updateThemeSettings('dark', accentColor)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      theme === 'dark' 
                        ? 'border-accent-color bg-accent-color/10' 
                        : 'border-border-color hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold mb-1">Dark</div>
                    <div className="text-sm text-text-secondary">Only dark mode available</div>
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium mb-3">
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
                <label className="block text-sm font-medium mb-3">
                  Preview
                </label>
                <div className="aero-glass p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: accentColor }}
                    >
                      U
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: accentColor }}>
                        Your Name
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
