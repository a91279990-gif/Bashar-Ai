import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  User as UserIcon,
  Lock,
  RefreshCw,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Bot,
  AlertCircle,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, stats, updateProfile, changePassword, logout, syncNow, isSyncing, lastSynced } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sync'>('profile');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Name & bio update state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Avatar presets
  const avatarPresets = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'Bashar')}`,
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
    'https://api.dicebear.com/7.x/micah/svg?seed=Zack',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Aiden',
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || avatarPresets[0]);

  // Handle Logo / Photo File Upload from Device
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'দয়া করে একটি সঠিক ছবি ফাইল নির্বাচন করুন।' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 256x256 on canvas for speed and efficiency
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Url = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedAvatar(base64Url);
          setProfileMessage({
            type: 'success',
            text: 'লোগো নির্বাচিত হয়েছে! সংরক্ষণ করতে নিচের "নাম ও তথ্য সংরক্ষণ করুন" বাটনে ক্লিক করুন।',
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!name.trim()) {
      setProfileMessage({ type: 'error', text: 'নামের ঘর ফাঁকা রাখা যাবে না।' });
      return;
    }

    setIsUpdatingProfile(true);
    const res = await updateProfile({ name: name.trim(), bio: bio.trim(), avatar: selectedAvatar });
    setIsUpdatingProfile(false);

    if (res.success) {
      setProfileMessage({ type: 'success', text: 'আপনার নাম ও প্রোফাইল সফলভাবে আপডেট হয়েছে!' });
      setTimeout(() => setProfileMessage(null), 3000);
    } else {
      setProfileMessage({ type: 'error', text: res.error || 'আপডেট করতে সমস্যা হয়েছে।' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'সবগুলো ঘর পূরণ করুন।' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'নতুন পাসওয়ার্ড দুটি মিলছে না।' });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordMessage({ type: 'success', text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 3500);
    } else {
      setPasswordMessage({ type: 'error', text: res.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' });
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'আজ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 dark:bg-slate-900/95 shadow-2xl p-6 sm:p-7 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatar || selectedAvatar}
                alt={user.name}
                className="w-12 h-12 rounded-full border-2 border-indigo-500/50 bg-slate-800 object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{user.name}</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  সদস্য
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Tabs */}
        <div className="flex gap-2 my-4 p-1 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>প্রোফাইল ও নাম</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>পাসওয়ার্ড পরিবর্তন</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'sync'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিয়েল-টাইম ডাটা</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {/* TAB 1: Profile & Name */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              {/* Logo / Avatar Upload & Presets */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200">
                      লোগো বা ছবি আপলোড (Logo / Photo)
                    </label>
                    <p className="text-[11px] text-slate-400">আপনার ডিভাইস থেকে যেকোনো ছবি বা লোগো যুক্ত করুন</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ছবি আপলোড</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={selectedAvatar}
                      alt="Selected"
                      className="w-14 h-14 rounded-2xl border-2 border-indigo-500 object-cover bg-slate-800 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-500 transition-colors"
                      title="নতুন ছবি দিন"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-slate-400 block mb-1">অথবা ডিফল্ট অ্যাভাটার বেছে নিন:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {avatarPresets.map((av, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`relative rounded-xl p-0.5 border-2 transition-all shrink-0 ${
                            selectedAvatar === av
                              ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30'
                              : 'border-transparent hover:border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="Preset" className="w-8 h-8 rounded-lg bg-slate-800" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  আপনার নাম (Name)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm outline-none transition-all"
                  placeholder="আপনার নাম লিখুন"
                />
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  সংক্ষিপ্ত পরিচয় / বায়ো (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm outline-none transition-all resize-none"
                  placeholder="যেমন: এআই প্রযুক্তির অনুরাগী ও প্রোগ্রামার"
                />
              </div>

              {/* Email (Read-Only) */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Gmail / ইমেইল ঠিকানা (স্থায়ী)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 text-sm cursor-not-allowed outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUpdatingProfile ? (
                  <span>সংরক্ষণ হচ্ছে...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>নাম ও তথ্য সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {passwordMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  বর্তমান পাসওয়ার্ড (Current Password)
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm outline-none transition-all"
                  placeholder="আপনার বর্তমান পাসওয়ার্ড লিখুন"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  নতুন পাসওয়ার্ড (New Password)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm outline-none transition-all"
                  placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm New Password)
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm outline-none transition-all"
                  placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <span>পরিবর্তন হচ্ছে...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>পাসওয়ার্ড আপডেট করুন</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: Real-Time Sync & Stats */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-200">
                      রিয়েল-টাইম ডাটা সিঙ্ক সক্রিয়
                    </span>
                  </div>
                  <button
                    onClick={syncNow}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক করুন'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">মোট কথোপকথন:</span>
                    <span className="text-base font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      {stats?.totalChats || 0} টি
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">মোট প্রশ্ন/উত্তর:</span>
                    <span className="text-base font-bold text-white flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      {stats?.totalMessages || 0} টি
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>সর্বশেষ সিঙ্ক: {lastSynced || 'সক্রিয়'}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3 h-3" />
                    যোগদান: {formattedDate}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                  আপনার সমস্ত কথোপকথন ও সেটিংস ক্লাউড ডাটাবেসে রিয়েল-টাইমে স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে। যেকোনো ডিভাইস থেকে লগইন করলেই পূর্বের সমস্ত ডাটা দেখতে পাবেন।
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Logout */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট করুন</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
