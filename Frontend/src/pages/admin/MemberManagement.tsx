// src/pages/admin/MemberManagement.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { userService } from '../../services/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Download, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle,
  X,
  Save,
  RefreshCw,
  Eye,
  Wallet,
  HandCoins,
  TrendingUp,
  AlertCircle,
  Briefcase,
  UsersRound,
  UserCircle2,
  Banknote
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface Member {
  id: number;
  name: string;
  email: string;
  nip: string | null;
  nik: string | null;
  unit: string;
  phone: string | null;
  status: 'active' | 'inactive';
  employment_type: 'pppk' | 'outsourcing' | 'other';
  cooperative_position: string | null;
  gender: 'male' | 'female' | null;
  role: {
    id: number;
    name: string;
  };
  join_date: string;
  created_at: string;
}

const ROLES = [
  { id: 1, name: 'admin', label: 'Admin' },
  { id: 2, name: 'ketua', label: 'Ketua' },
  { id: 3, name: 'bendahara', label: 'Bendahara' },
  { id: 4, name: 'sekretaris', label: 'Sekretaris' },
  { id: 5, name: 'pengawas', label: 'Pengawas' },
  { id: 6, name: 'anggota', label: 'Anggota' }
];

const EMPLOYMENT_TYPES = [
  { value: 'pppk', label: 'PPPK' },
  { value: 'outsourcing', label: 'Outsourcing' },
  { value: 'other', label: 'Lain-lain' }
];

const COOPERATIVE_POSITIONS = [
  'Ketua Koperasi',
  'Wakil Ketua Koperasi',
  'Sekretaris Koperasi',
  'Bendahara Koperasi',
  'Pengawas Koperasi',
  'Pengurus',
  'Anggota Biasa',
  '-'
];

const GENDERS = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' }
];

const MemberManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [idType, setIdType] = useState<'NIP' | 'NIK'>('NIP');
  const [formError, setFormError] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    nip: '',
    nik: '',
    unit: '',
    phone: '',
    role_id: 6,
    join_date: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'inactive',
    employment_type: 'other' as 'pppk' | 'outsourcing' | 'other',
    cooperative_position: '',
    gender: '' as 'male' | 'female' | ''
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getRoleLabel = (roleName: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'Admin',
      'ketua': 'Ketua',
      'bendahara': 'Bendahara',
      'sekretaris': 'Sekretaris',
      'pengawas': 'Pengawas',
      'anggota': 'Anggota'
    };
    return roleMap[roleName] || roleName;
  };

  const getRoleColor = (roleName: string) => {
    const colorMap: Record<string, string> = {
      'admin': 'bg-purple-100 text-purple-700',
      'ketua': 'bg-red-100 text-red-700',
      'bendahara': 'bg-emerald-100 text-emerald-700',
      'sekretaris': 'bg-blue-100 text-blue-700',
      'pengawas': 'bg-amber-100 text-amber-700',
      'anggota': 'bg-gray-100 text-gray-700'
    };
    return colorMap[roleName] || 'bg-gray-100 text-gray-700';
  };

  const getEmploymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'pppk': 'PPPK',
      'outsourcing': 'Outsourcing',
      'other': 'Lain-lain'
    };
    return types[type] || type;
  };

  const getGenderLabel = (gender: string | null) => {
    if (!gender) return '-';
    return gender === 'male' ? 'Laki-laki' : 'Perempuan';
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await userService.getUsers(page);
      const data = response.data.data;
      setMembers(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        per_page: data.per_page,
        total: data.total
      });
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchMembers(pagination.current_page);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    
    let formattedDate = member.join_date;
    if (formattedDate && formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }
    
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      password_confirmation: '',
      nip: member.nip || '',
      nik: member.nik || '',
      unit: member.unit,
      phone: member.phone || '',
      role_id: member.role.id,
      join_date: formattedDate,
      status: member.status,
      employment_type: member.employment_type || 'other',
      cooperative_position: member.cooperative_position || '',
      gender: member.gender || ''
    });
    setIdType(member.nip ? 'NIP' : 'NIK');
    setShowAddModal(true);
  };

  const handleCreateMember = async () => {
    setFormError('');

    if (!formData.name || !formData.email) {
      setFormError('Nama dan Email wajib diisi');
      return;
    }

    if (!editingMember && !formData.password) {
      setFormError('Password wajib diisi untuk anggota baru');
      return;
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      setFormError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password && formData.password.length < 4) {
      setFormError('Password minimal 4 karakter');
      return;
    }

    if (!formData.unit) {
      setFormError('Seksi/Bagian wajib diisi');
      return;
    }

    if (!formData.gender) {
      setFormError('Jenis kelamin wajib dipilih');
      return;
    }

    setSaving(true);
    try {
      let submitData: any = {};

      if (editingMember) {
        submitData = {
          name: formData.name,
          email: editingMember.email,
          unit: formData.unit,
          phone: formData.phone || null,
          role_id: formData.role_id,
          join_date: formData.join_date,
          status: formData.status,
          employment_type: formData.employment_type,
          cooperative_position: formData.cooperative_position || null,
          gender: formData.gender
        };

        if (formData.nip && formData.nip.trim() !== '') {
          submitData.nip = formData.nip;
        } else {
          submitData.nip = null;
        }

        if (formData.nik && formData.nik.trim() !== '') {
          submitData.nik = formData.nik;
        } else {
          submitData.nik = null;
        }

        if (formData.password) {
          submitData.password = formData.password;
        }
      } else {
        submitData = {
          name: formData.name,
          email: formData.email,
          unit: formData.unit,
          phone: formData.phone || null,
          role_id: formData.role_id,
          join_date: formData.join_date,
          status: formData.status,
          employment_type: formData.employment_type,
          cooperative_position: formData.cooperative_position || null,
          gender: formData.gender,
          password: formData.password,
          password_confirmation: formData.password_confirmation
        };

        if (formData.nip && formData.nip.trim() !== '') {
          submitData.nip = formData.nip;
        }
        if (formData.nik && formData.nik.trim() !== '') {
          submitData.nik = formData.nik;
        }
      }

      if (editingMember) {
        await userService.updateUser(editingMember.id, submitData);
        alert('Anggota berhasil diperbarui');
      } else {
        await userService.createUser(submitData);
        alert('Anggota baru berhasil ditambahkan');
      }

      await fetchMembers(pagination.current_page);
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to save member:', error);

      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
          .join('\n');
        setFormError(errorMessages);
      } else if (error.response?.data?.message) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Gagal menyimpan data');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
      try {
        await userService.deleteUser(id);
        await fetchMembers(pagination.current_page);
        alert('Anggota berhasil dihapus');
      } catch (error) {
        console.error('Failed to delete member:', error);
        alert('Gagal menghapus anggota');
      }
    }
  };

  const resetForm = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      nip: '',
      nik: '',
      unit: '',
      phone: '',
      role_id: 6,
      join_date: new Date().toISOString().split('T')[0],
      status: 'active',
      employment_type: 'other',
      cooperative_position: '',
      gender: ''
    });
    setIdType('NIP');
    setFormError('');
  };

  const filteredMembers = members.filter((member) =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.nik?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedMember(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">Detail Anggota</h3>
                <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-700/30 rounded-3xl">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.name}`} 
                    alt="" 
                    className="w-16 h-16 rounded-2xl border-2 border-white dark:border-neutral-700 shadow-sm" 
                  />
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{selectedMember.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">
                      {selectedMember.nip || selectedMember.nik || '-'}
                    </p>
                    <p className="text-[10px] font-bold text-imigrasi-primary dark:text-imigrasi-accent uppercase tracking-wider mt-1">
                      {selectedMember.unit}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-700">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedMember.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-700">
                    <span className="text-sm text-gray-500">Telepon</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedMember.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-700">
                    <span className="text-sm text-gray-500">Jenis Kelamin</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{getGenderLabel(selectedMember.gender)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-700">
                    <span className="text-sm text-gray-500">Status Kepegawaian</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{getEmploymentTypeLabel(selectedMember.employment_type)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-700">
                    <span className="text-sm text-gray-500">Jabatan di Koperasi</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedMember.cooperative_position || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-700">
                    <span className="text-sm text-gray-500">Role</span>
                    <span className="text-sm font-medium capitalize">{getRoleLabel(selectedMember.role.name)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-700">
                    <span className="text-sm text-gray-500">Tanggal Bergabung</span>
                    <span className="text-sm font-medium">{formatDate(selectedMember.join_date)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedMember.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedMember.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white sticky top-0">
                <h3 className="font-bold text-xl">{editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}</h3>
                <button onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                {formError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-400 whitespace-pre-line">{formError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nama Lengkap */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Lengkap *</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Masukkan nama..." 
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email *</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Masukkan email..." 
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                      Password {!editingMember && '*'}
                    </label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={editingMember ? "Kosongkan jika tidak diubah" : "Masukkan password (min. 4 karakter)"} 
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                    />
                  </div>

                  {/* Konfirmasi Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                      Konfirmasi Password {!editingMember && '*'}
                    </label>
                    <input 
                      type="password" 
                      value={formData.password_confirmation}
                      onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                      placeholder="Konfirmasi password..." 
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                    />
                  </div>

                  {/* NIP/NIK */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        NIP / NIK
                      </label>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setIdType('NIP');
                            setFormData({...formData, nip: '', nik: ''});
                          }}
                          className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors", 
                            idType === 'NIP' ? "bg-imigrasi-primary text-white" : "bg-gray-100 text-gray-400"
                          )}
                        >
                          NIP
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setIdType('NIK');
                            setFormData({...formData, nip: '', nik: ''});
                          }}
                          className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors", 
                            idType === 'NIK' ? "bg-imigrasi-primary text-white" : "bg-gray-100 text-gray-400"
                          )}
                        >
                          NIK
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={idType === 'NIP' ? formData.nip : formData.nik}
                      onChange={(e) => {
                        if (idType === 'NIP') {
                          setFormData({...formData, nip: e.target.value});
                        } else {
                          setFormData({...formData, nik: e.target.value});
                        }
                      }}
                      placeholder={`Masukkan ${idType}...`} 
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                    />
                  </div>

                  {/* Jenis Kelamin */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Jenis Kelamin *</label>
                    <div className="flex gap-4">
                      {GENDERS.map((gender) => (
                        <label key={gender.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value={gender.value}
                            checked={formData.gender === gender.value}
                            onChange={(e) => setFormData({...formData, gender: e.target.value as 'male' | 'female'})}
                            className="w-4 h-4 text-imigrasi-primary"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{gender.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status Kepegawaian */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Status Kepegawaian *</label>
                    <select 
                      value={formData.employment_type}
                      onChange={(e) => setFormData({...formData, employment_type: e.target.value as 'pppk' | 'outsourcing' | 'other'})}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seksi/Bagian */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Seksi / Bagian *</label>
                    <select 
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    >
                      <option value="">Pilih Seksi/Bagian</option>
                      <option value="Seksi Izin Tinggal">Seksi Izin Tinggal</option>
                      <option value="Seksi Lalu Lintas">Seksi Lalu Lintas</option>
                      <option value="Seksi Intelijen">Seksi Intelijen</option>
                      <option value="Seksi TIKIM">Seksi TIKIM</option>
                      <option value="Sekretariat">Sekretariat</option>
                    </select>
                  </div>

                  {/* Nomor Telepon */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nomor Telepon</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Contoh: 081234567890" 
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Role *</label>
                    <select 
                      value={formData.role_id}
                      onChange={(e) => setFormData({...formData, role_id: parseInt(e.target.value)})}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    >
                      {ROLES.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jabatan di Koperasi */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Jabatan di Koperasi</label>
                    <select 
                      value={formData.cooperative_position}
                      onChange={(e) => setFormData({...formData, cooperative_position: e.target.value})}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    >
                      {COOPERATIVE_POSITIONS.map((position) => (
                        <option key={position} value={position === '-' ? '' : position}>
                          {position === '-' ? 'Tidak Ada' : position}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tanggal Bergabung */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tanggal Bergabung *</label>
                    <input 
                      type="date" 
                      value={formData.join_date}
                      onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Tidak Aktif</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-4 bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleCreateMember}
                    disabled={saving}
                    className="flex-1 py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? 'Menyimpan...' : (editingMember ? 'Simpan Perubahan' : 'Simpan Anggota')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Anggota</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola database anggota, verifikasi pendaftaran, dan atur hak akses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20"
          >
            <UserPlus size={18} />
            Tambah Anggota
          </button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama, NIP, NIK, email, atau unit kerja..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Anggota</th>
                <th className="px-6 py-4 font-bold">NIP/NIK</th>
                <th className="px-6 py-4 font-bold">Jenis Kelamin</th>
                <th className="px-6 py-4 font-bold">Status Kepegawaian</th>
                <th className="px-6 py-4 font-bold">Unit Kerja</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                   </td>
                 </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data anggota
                   </td>
                 </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                          alt="" 
                          className="w-10 h-10 rounded-xl border-2 border-gray-100 dark:border-neutral-700" 
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-[10px] text-gray-500">{member.email}</p>
                        </div>
                      </div>
                     </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {member.nip || member.nik || '-'}
                     </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {getGenderLabel(member.gender)}
                     </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        {getEmploymentTypeLabel(member.employment_type)}
                      </span>
                     </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{member.unit}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getRoleColor(member.role.name))}>
                        {getRoleLabel(member.role.name)}
                      </span>
                     </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {member.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                     </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedMember(member)}
                          className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(member)}
                          className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                     </td>
                   </tr>
                ))
              )}
            </tbody>
           </table>
        </div>
        
        {!loading && pagination.last_page > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchMembers(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 rounded-lg bg-imigrasi-primary text-white">
                {pagination.current_page}
              </span>
              <button
                onClick={() => fetchMembers(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</h4>
            <p className="text-xs text-gray-500">Total Anggota Terdaftar</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <RefreshCw size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
              {members.filter(m => m.status === 'active').length}
            </h4>
            <p className="text-xs text-gray-500">Anggota Aktif</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            <Shield size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
              {members.filter(m => m.role.name !== 'anggota').length}
            </h4>
            <p className="text-xs text-gray-500">Pengurus Koperasi</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
            <UsersRound size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
              {members.filter(m => m.employment_type === 'pppk').length}
            </h4>
            <p className="text-xs text-gray-500">PPPK</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MemberManagement;