export interface User {
  id: string;
  name: string;
  nip: string;
  nik: string;
  unitKerja: string;
  role: 'member' | 'admin' | 'secretary' | 'treasurer' | 'chairman';
  status: 'Aktif' | 'Non-Aktif';
  avatar?: string;
  phone?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}

export interface Savings {
  pokok: number;
  wajib: number;
  sukarela: number;
  total: number;
}

export interface Loan {
  id: string;
  amount: number;
  remaining: number;
  tenor: number; // months
  paidInstallments: number;
  dueDate: string;
  status: 'Active' | 'Paid' | 'Pending' | 'Rejected';
  dateApplied: string;
}

export interface Transaction {
  id: string;
  type: 'Simpanan' | 'Pinjaman' | 'Penarikan';
  category: string;
  amount: number;
  date: string;
  status: 'Success' | 'Pending' | 'Failed';
}

export interface SHU {
  year: number;
  amount: number;
  participation: number;
}
