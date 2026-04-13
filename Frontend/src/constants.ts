import { User, Savings, Loan, Transaction, SHU } from './types';

export const DUMMY_USER: User = {
  id: 'USR001',
  name: 'Budi Santoso',
  nip: '198501012010011001',
  nik: '1571012345678901',
  unitKerja: 'Seksi Izin Tinggal Keimigrasian',
  role: 'member',
  status: 'Aktif',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
  bankName: 'Bank Mandiri',
  bankAccountName: 'Budi Santoso',
  bankAccountNumber: '1234567890'
};

export const DUMMY_ADMIN: User = {
  id: 'ADM001',
  name: 'Siti Aminah',
  nip: '197805122005012002',
  nik: '1571019876543210',
  unitKerja: 'Sekretariat Koperasi',
  role: 'admin',
  status: 'Aktif',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti'
};

export const DUMMY_SECRETARY: User = {
  id: 'SEC001',
  name: 'Hendra Wijaya',
  nip: '198203152008011003',
  nik: '1571012233445566',
  unitKerja: 'Sekretariat',
  role: 'secretary',
  status: 'Aktif',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hendra'
};

export const DUMMY_TREASURER: User = {
  id: 'TRE001',
  name: 'Dewi Lestari',
  nip: '198005202006042001',
  nik: '1571017788990011',
  unitKerja: 'Bendahara',
  role: 'treasurer',
  status: 'Aktif',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi'
};

export const DUMMY_CHAIRMAN: User = {
  id: 'CHA001',
  name: 'Drs. M. Yusuf',
  nip: '197001011995031001',
  nik: '1571011122334455',
  unitKerja: 'Ketua Koperasi',
  role: 'chairman',
  status: 'Aktif',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yusuf'
};

export const DUMMY_SAVINGS: Savings = {
  pokok: 1000000,
  wajib: 2500000,
  sukarela: 5000000,
  total: 8500000
};

export const DUMMY_LOANS: Loan[] = [
  {
    id: 'PJ-2024-001',
    amount: 10000000,
    remaining: 4000000,
    tenor: 12,
    paidInstallments: 8,
    dueDate: '2026-04-15',
    status: 'Active',
    dateApplied: '2024-08-10'
  },
  {
    id: 'PJ-2023-045',
    amount: 5000000,
    remaining: 0,
    tenor: 6,
    paidInstallments: 6,
    dueDate: '2024-02-15',
    status: 'Paid',
    dateApplied: '2023-08-10'
  }
];

export const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: 'TRX-001', type: 'Simpanan', category: 'Wajib', amount: 100000, date: '2026-03-01', status: 'Success' },
  { id: 'TRX-002', type: 'Simpanan', category: 'Sukarela', amount: 500000, date: '2026-03-05', status: 'Success' },
  { id: 'TRX-003', type: 'Pinjaman', category: 'Angsuran', amount: 850000, date: '2026-03-15', status: 'Success' },
  { id: 'TRX-004', type: 'Penarikan', category: 'Sukarela', amount: 1000000, date: '2026-03-20', status: 'Success' },
];

export const DUMMY_SHU: SHU[] = [
  { year: 2025, amount: 1250000, participation: 85 },
  { year: 2024, amount: 1100000, participation: 80 },
  { year: 2023, amount: 950000, participation: 75 },
];
