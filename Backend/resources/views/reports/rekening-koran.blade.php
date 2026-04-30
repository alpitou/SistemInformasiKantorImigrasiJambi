{{-- resources/views/reports/rekening-koran.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Rekening Koran - {{ $member->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', 'Helvetica', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1a1a1a;
            background: white;
            padding: 20px;
        }
        .container { max-width: 100%; margin: 0 auto; }
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #1a3c6e;
        }
        .header h1 { font-size: 18px; font-weight: bold; color: #1a3c6e; text-transform: uppercase; }
        .header h2 { font-size: 14px; font-weight: normal; text-transform: uppercase; }
        .header p { font-size: 10px; color: #666; }
        .period { text-align: right; font-weight: bold; font-size: 11px; margin: 10px 0; padding: 5px; background: #f5f5f5; }
        .confidential {
            text-align: center;
            color: #c0392b;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 2px;
            margin: 10px 0;
            padding: 5px;
            border: 1px dashed #c0392b;
        }
        .section { margin-bottom: 20px; border: 1px solid #d0d0d0; border-radius: 4px; overflow: hidden; }
        .section-title {
            font-weight: bold;
            font-size: 11px;
            background-color: #1a3c6e;
            color: white;
            padding: 8px 12px;
            text-transform: uppercase;
        }
        .section-content { padding: 15px; }
        .info-grid { display: flex; flex-wrap: wrap; }
        .info-row { width: 50%; margin-bottom: 10px; }
        .info-label { font-weight: bold; display: inline-block; width: 100px; color: #555; }
        .info-value { display: inline-block; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th, .table td { border: 1px solid #d0d0d0; padding: 8px 10px; vertical-align: top; }
        .table th { background-color: #e8f0fe; font-weight: bold; font-size: 10px; text-transform: uppercase; color: #1a3c6e; }
        .table tr:nth-child(even) { background-color: #fafafa; }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .summary-row { background-color: #e8f0fe !important; font-weight: bold; }
        .total-row { background-color: #1a3c6e !important; color: white !important; }
        .footer {
            margin-top: 25px;
            font-size: 9px;
            text-align: center;
            border-top: 1px solid #d0d0d0;
            padding-top: 15px;
            color: #777;
        }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 45%; }
        .signature-line { margin-top: 50px; border-top: 1px solid #1a1a1a; width: 80%; margin-left: auto; margin-right: auto; }
        .signature-name { margin-top: 8px; font-weight: bold; font-size: 11px; }
        .signature-title { margin-top: 5px; font-size: 9px; color: #555; }
        @media print {
            body { padding: 0; margin: 0; }
            .section-title { background-color: #1a3c6e !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .summary-row { background-color: #e8f0fe !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .total-row { background-color: #1a3c6e !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>KOPERASI KARYAWAN IMIGRASI</h1>
            <h2>KANTOR IMIGRASI KELAS I TPI JAMBI</h2>
            <p>Jl. Jend. Sudirman No. 123, Kota Jambi - Jambi 36122</p>
        </div>
        
        <div class="period">PERIODE BULAN: {{ strtoupper($month) }}</div>
        <div class="confidential">DOKUMEN RAHASIA - UNTUK KEPENTINGAN INTERNAL</div>
        
        <!-- Informasi Anggota -->
        <div class="section">
            <div class="section-title">A. INFORMASI ANGGOTA</div>
            <div class="section-content">
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">Nama Lengkap</span>
                        <span class="info-value">: {{ strtoupper($member->name) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">NIP</span>
                        <span class="info-value">: {{ $member->nip ?? '-' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Jabatan</span>
                        <span class="info-value">: {{ $member->position ?? '-' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Unit Kerja</span>
                        <span class="info-value">: {{ $member->unit ?? '-' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Alamat</span>
                        <span class="info-value">: {{ $member->address ?? '-' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">No. Telepon</span>
                        <span class="info-value">: {{ $member->phone ?? '-' }}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Informasi Investasi -->
        <div class="section">
            <div class="section-title">B. INFORMASI INVESTASI ANGGOTA</div>
            <div class="section-content">
                <table class="table">
                    <tbody>
                        <tr><td width="70%">Simpanan Pokok</td><td class="text-right">{{ $formatCurrency($pokok_balance) }}</td></tr>
                        <tr><td>Simpanan Wajib</td><td class="text-right">{{ $formatCurrency($wajib_balance) }}</td></tr>
                        <tr><td>Simpanan Sukarela</td><td class="text-right">{{ $formatCurrency($sukarela_balance) }}</td></tr>
                        <tr class="summary-row"><td class="font-bold">Total Investasi Anggota</td><td class="text-right font-bold">{{ $formatCurrency($total_savings) }}</td></tr>
                        <tr><td>Sisa Hasil Usaha (SHU)</td><td class="text-right">{{ $formatCurrency($shu_total) }}</td></tr>
                        <tr class="total-row"><td class="font-bold">TOTAL INVESTASI + SHU</td><td class="text-right font-bold">{{ $formatCurrency($total_savings + $shu_total) }}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Informasi Pembiayaan -->
        <div class="section">
            <div class="section-title">C. INFORMASI PEMBIAYAAN ANGGOTA</div>
            <div class="section-content">
                <table class="table">
                    <tbody>
                        @if($has_loan)
                        <tr><td width="70%">Status Pembiayaan</td><td class="text-center"><span style="background:#27ae60;color:white;padding:3px 10px;border-radius:3px;">AKTIF</span></td></tr>
                        <tr><td>Jumlah Pembiayaan</td><td class="text-right">{{ $formatCurrency($loan_amount) }}</td></tr>
                        <tr><td>Jangka Waktu (Tenor)</td><td class="text-right">{{ $tenor }} Bulan</td></tr>
                        <tr><td>Angsuran per Bulan</td><td class="text-right">{{ $formatCurrency($monthly_installment) }}</td></tr>
                        <tr><td>Sisa Saldo Pembiayaan</td><td class="text-right">{{ $formatCurrency($remaining_balance) }}</td></tr>
                        @else
                        <tr><td class="text-center" colspan="2"><em>TIDAK ADA PEMBIAYAAN AKTIF</em></td></tr>
                        @endif
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Riwayat Transaksi -->
        <div class="section">
            <div class="section-title">D. RIWAYAT TRANSAKSI SIMPANAN</div>
            <div class="section-content">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Jenis Simpanan</th>
                            <th>Debit (Setoran)</th>
                            <th>Kredit (Penarikan)</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($transactions as $transaction)
                        <tr>
                            <td>{{ \Carbon\Carbon::parse($transaction->transaction_date)->format('d/m/Y') }}</td>
                            <td>{{ $transaction->type->name ?? 'Simpanan' }}</td>
                            <td class="text-right">
                                @if($transaction->transaction_type === 'deposit')
                                    {{ $formatCurrency($transaction->amount) }}
                                @else
                                    -
                                @endif
                            </td>
                            <td class="text-right">
                                @if($transaction->transaction_type === 'withdrawal')
                                    {{ $formatCurrency($transaction->amount) }}
                                @else
                                    -
                                @endif
                            </td>
                            <td>{{ $transaction->description ?? '-' }}</td>
                        </tr>
                        @empty
                        <tr><td colspan="5" class="text-center">Belum ada transaksi</td></tr>
                        @endforelse
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" class="text-right font-bold">TOTAL</td>
                            <td class="text-right font-bold">{{ $formatCurrency($total_deposits) }}</td>
                            <td class="text-right font-bold">{{ $formatCurrency($total_withdrawals) }}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>Dokumen ini dicetak secara otomatis oleh Sistem Informasi Koperasi (SIMKOP-IM)</p>
            <p>Dicetak pada: {{ $generated_at->format('d/m/Y H:i:s') }}</p>
            <p>&copy; {{ date('Y') }} Koperasi Karyawan Imigrasi Kantor Imigrasi Kelas I TPI Jambi.</p>
        </div>
        
        <div class="signature">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-name">{{ $member->name }}</div>
                <div class="signature-title">Anggota</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-name">_________________</div>
                <div class="signature-title">Bendahara Koperasi</div>
            </div>
        </div>
    </div>
</body>
</html>