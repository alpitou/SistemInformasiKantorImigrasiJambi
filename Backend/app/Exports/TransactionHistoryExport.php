<?php
// app/Exports/TransactionHistoryExport.php
namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class TransactionHistoryExport implements FromArray, WithHeadings, ShouldAutoSize, WithStyles
{
    protected $transactions;
    protected $month;
    protected $userName;

    public function __construct(array $transactions, $month, $userName)
    {
        $this->transactions = $transactions;
        $this->month = $month;
        $this->userName = $userName;
    }

    public function array(): array
    {
        $data = [];
        $no = 1;
        
        foreach ($this->transactions as $transaction) {
            $jenisTransaksi = $this->getJenisTransaksi($transaction);
            $jumlah = $transaction['amount'];
            
            if (in_array($transaction['type'], ['loan_installment', 'withdrawal']) || 
                ($transaction['transaction_type'] ?? null) === 'withdrawal') {
                $jumlah = -$transaction['amount'];
            }
            
            $data[] = [
                $no++,
                $this->formatDate($transaction['date']),
                $jenisTransaksi,
                $transaction['category'] ?? '-',
                $transaction['description'] ?? '-',
                number_format($jumlah, 0, ',', '.'),
                $this->getStatusText($transaction),
                $transaction['user'] ?? 'Sistem'
            ];
        }
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'NO',
            'TANGGAL TRANSAKSI',
            'JENIS TRANSAKSI',
            'KATEGORI',
            'DESKRIPSI',
            'JUMLAH (Rp)',
            'STATUS',
            'DIBUAT OLEH'
        ];
    }

    private function getJenisTransaksi($transaction): string
    {
        if (($transaction['type'] ?? '') === 'withdrawal' || ($transaction['transaction_type'] ?? '') === 'withdrawal') {
            return 'PENARIKAN SUKARELA';
        }
        
        switch ($transaction['type']) {
            case 'saving':
                return 'SETORAN SUKARELA';
            case 'payroll':
                return 'POTONGAN PAYROLL (WAJIB)';
            case 'loan_installment':
                return 'ANGSURAN PINJAMAN';
            default:
                return 'TRANSAKSI LAINNYA';
        }
    }

    private function getStatusText($transaction): string
    {
        if (($transaction['transaction_type'] ?? '') === 'withdrawal') {
            if (isset($transaction['verification_status']) && $transaction['verification_status'] === 'pending') {
                return 'MENUNGGU VERIFIKASI';
            }
            return 'DIPROSES';
        }
        
        if (($transaction['type'] ?? '') === 'loan_installment') {
            return 'LUNAS';
        }
        
        if (isset($transaction['verification_status']) && $transaction['verification_status'] === 'pending') {
            return 'MENUNGGU VERIFIKASI';
        }
        
        return 'BERHASIL';
    }

    private function formatDate($date): string
    {
        if (!$date) return '-';
        $timestamp = strtotime($date);
        if ($timestamp === false) return '-';
        return date('d/m/Y', $timestamp);
    }

    public function styles(Worksheet $sheet)
    {
        // Style untuk header
        $sheet->getStyle('A1:H1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 11,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2C3E50']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);
        
        // Style untuk border semua cell
        $highestRow = $sheet->getHighestRow();
        if ($highestRow > 1) {
            $sheet->getStyle('A1:H' . $highestRow)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC']
                    ]
                ]
            ]);
        }
        
        // Alignment untuk kolom No
        $sheet->getStyle('A2:A' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Alignment untuk kolom Jumlah
        $sheet->getStyle('F2:F' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        
        // Set tinggi baris header
        $sheet->getRowDimension(1)->setRowHeight(20);
        
        return $sheet;
    }
}