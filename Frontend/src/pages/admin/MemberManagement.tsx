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
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

const MemberManagement: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [idType, setIdType] = useState<'NIP' | 'NIK'>('NIP');
  const [generatedId] = useState('USR' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    fetchMembers();
  }, []);
  
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers();
      setMembers(response.data?.data ?? []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
      await fetchMembers();
    setIsLoading(false);
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setShowAddModal(true);
  };
  
  const handleCreateMember = async (memberData: any) => {
    try {
      await userService.createUser(memberData);
      await fetchMembers();
      setShowAddModal(false);
      alert('Anggota berhasil ditambahkan');
    } catch (error) {
      console.error('Failed to create member:', error);
      alert('Gagal menambahkan anggota');
    }
  };
  
  const handleUpdateMember = async (id: number, memberData: any) => {
    try {
      await userService.updateUser(id, memberData);
      await fetchMembers();
      setShowAddModal(false);
      setEditingMember(null);
      alert('Anggota berhasil diperbarui');
    } catch (error) {
      console.error('Failed to update member:', error);
      alert('Gagal memperbarui anggota');
    }
  };
  
  const handleDeleteMember = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
      try {
        await userService.deleteUser(id);
        await fetchMembers();
        alert('Anggota berhasil dihapus');
      } catch (error) {
        console.error('Failed to delete member:', error);
        alert('Gagal menghapus anggota');
      }
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.unit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Member Details Modal (Debt & Balance) */}
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
                <h3 className="font-bold text-xl">Detail Keuangan Anggota</h3>
                <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-700/30 rounded-3xl">
                  <img src={selectedMember.avatar} alt="" className="w-16 h-16 rounded-2xl border-2 border-white dark:border-neutral-700 shadow-sm" />
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{selectedMember.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{selectedMember.nip}</p>
                    <p className="text-[10px] font-bold text-imigrasi-primary dark:text-imigrasi-accent uppercase tracking-wider mt-1">{selectedMember.unit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Wallet className="text-emerald-600" size={20} />
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Total Simpanan</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(selectedMember.savings)}</p>
                  </div>

                  <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                      <HandCoins className="text-red-600" size={20} />
                      <span className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-widest">Sisa Pinjaman (Tagihan)</span>
                    </div>
                    <p className="text-2xl font-black text-red-700 dark:text-red-300">{formatCurrency(selectedMember.debt)}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <div className="flex gap-3">
                    <TrendingUp size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-800 dark:text-blue-400 leading-relaxed">
                      Data ini mencakup akumulasi simpanan pokok, wajib, dan sukarela, serta sisa pokok pinjaman yang belum dibayarkan.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">{editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}</h3>
                <button onClick={() => {
                  setShowAddModal(false);
                  setEditingMember(null);
                }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ID Anggota (Auto)</label>
                    <input type="text" value={editingMember?.id || generatedId} readOnly className="w-full p-4 bg-gray-100 dark:bg-neutral-900 border-2 border-transparent rounded-2xl outline-none font-mono text-imigrasi-primary dark:text-imigrasi-accent font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input type="text" defaultValue={editingMember?.name || ''} placeholder="Masukkan nama..." className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
                    <input type="email" defaultValue={editingMember?.email || ''} placeholder="Masukkan email..." className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                    <input type="password" placeholder={editingMember ? "Kosongkan jika tidak diubah" : "Masukkan password..."} className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{idType}</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIdType('NIP')}
                          className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors", idType === 'NIP' ? "bg-imigrasi-primary text-white" : "bg-gray-100 text-gray-400")}
                        >
                          NIP
                        </button>
                        <button 
                          onClick={() => setIdType('NIK')}
                          className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors", idType === 'NIK' ? "bg-imigrasi-primary text-white" : "bg-gray-100 text-gray-400")}
                        >
                          NIK
                        </button>
                      </div>
                    </div>
                    <input type="text" defaultValue={editingMember?.nip || ''} placeholder={`Masukkan ${idType}...`} className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Seksi / Bagian</label>
                    <select defaultValue={editingMember?.unit || 'Seksi Izin Tinggal'} className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white">
                      <option>Seksi Izin Tinggal</option>
                      <option>Seksi Lalu Lintas</option>
                      <option>Seksi Intelijen</option>
                      <option>Seksi TIKIM</option>
                      <option>Sekretariat</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nomor Telepon</label>
                    <input type="tel" defaultValue={editingMember?.phone || ''} placeholder="Contoh: 0812..." className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Role</label>
                    <select defaultValue={editingMember?.role || 'member'} className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white">
                      <option value="member">Anggota</option>
                      <option value="secretary">Sekretaris</option>
                      <option value="treasurer">Bendahara</option>
                      <option value="chairman">Ketua</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-neutral-700">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Data Rekening Bank</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Bank</label>
                      <input type="text" value="BRI" readOnly className="w-full p-4 bg-gray-100 dark:bg-neutral-900 border-2 border-transparent rounded-2xl outline-none font-bold text-gray-900 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nomor Rekening</label>
                      <input type="text" defaultValue={editingMember?.bankAccountNumber || ''} placeholder="Masukkan nomor rekening..." className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                  }} className="flex-1 py-4 bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 transition-all">
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => {
                        setIsLoading(false);
                        setShowAddModal(false);
                        setEditingMember(null);
                        alert(editingMember ? 'Data anggota berhasil diperbarui.' : 'Anggota baru berhasil ditambahkan.');
                      }, 1500);
                    }}
                    className="flex-1 py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    {editingMember ? 'Simpan Perubahan' : 'Simpan Anggota'}
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
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
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

      {/* Filters & Search */}
      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama, NIP, atau unit kerja..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-neutral-700 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Anggota</th>
                <th className="px-6 py-4 font-bold">NIP</th>
                <th className="px-6 py-4 font-bold">Unit Kerja</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} alt="" className="w-10 h-10 rounded-xl border-2 border-gray-100 dark:border-neutral-700" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">{member.nip}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{member.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {member.role === 'admin' ? 'Pengurus' : 'Anggota'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(currentUser?.role === 'secretary' || currentUser?.role === 'treasurer' || currentUser?.role === 'admin') && (
                        <button 
                          onClick={() => setSelectedMember(member)}
                          className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors"
                          title="Lihat Tagihan & Saldo"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(member)}
                        className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">245</h4>
            <p className="text-xs text-gray-500">Total Anggota Terdaftar</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <RefreshCw size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">12</h4>
            <p className="text-xs text-gray-500">Menunggu Verifikasi</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            <Shield size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">8</h4>
            <p className="text-xs text-gray-500">Administrator Sistem</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MemberManagement;
