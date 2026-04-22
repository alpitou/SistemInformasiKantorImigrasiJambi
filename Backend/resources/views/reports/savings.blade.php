<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Simpanan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1a56db;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #1a56db;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .info-section {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 8px;
        }
        .info-row {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        .summary-section {
            margin-bottom: 30px;
        }
        .summary-box {
            display: inline-block;
            width: 30%;
            margin-right: 3%;
            padding: 15px;
            background-color: #e0f2fe;
            border-radius: 8px;
            text-align: center;
        }
        .summary-box h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        .summary-box p {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #1a56db;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #1a56db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }
        .badge-success {
            background-color: #10b981;
            color: white;
        }
        .badge-warning {
            background-color: #f59e0b;
            color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Simpanan Anggota</h1>
        <p>Koperasi Karyawan Imigrasi</p>
        <p>Dicetak: {{ $generated_at->format('d/m/Y H:i:s') }}</p>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Nama Anggota:</span>
            <span>{{ $user->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">NIP:</span>
            <span>{{ $user->nip ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Unit Kerja:</span>
            <span>{{ $user->unit ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span>{{ $user->email }}</span>
        </div>
    </div>

    <div class="summary-section">
        <h3>Ringkasan Saldo Simpanan</h3>
        @foreach($summary as $type => $amount)
            @if($type !== 'total')
                <div class="summary-box">
                    <h4>{{ $type }}</h4>
                    <p>{{ $formatCurrency($amount) }}</p>
                </div>
            @endif
        @endforeach
        <div class="summary-box" style="background-color: #1a56db; color: white;">
            <h4 style="color: white;">TOTAL</h4>
            <p style="color: white;">{{ $formatCurrency($summary['total']) }}</p>
        </div>
    </div>

    <h3>Riwayat Transaksi Simpanan</h3>
    <table>
        <thead>
            <tr>
                <th>Tanggal</th>
                <th>Jenis Simpanan</th>
                <th>Tipe Transaksi</th>
                <th class="text-right">Jumlah</th>
                <th>Status</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $transaction)
            <tr>
                <td>{{ \Carbon\Carbon::parse($transaction->transaction_date)->format('d/m/Y') }}</td>
                <td>{{ $transaction->type->name ?? '-' }}</td>
                <td>
                    {{ $transaction->transaction_type === 'deposit' ? 'Setoran' : 'Penarikan' }}
                </td>
                <td class="text-right">
                    {{ $formatCurrency($transaction->amount) }}
                </td>
                <td class="text-center">
                    @if($transaction->transaction_type === 'deposit')
                        @if($transaction->verification_status === 'verified')
                            <span class="badge badge-success">Terverifikasi</span>
                        @else
                            <span class="badge badge-warning">Menunggu</span>
                        @endif
                    @else
                        <span class="badge badge-success">Selesai</span>
                    @endif
                </td>
                <td>{{ $transaction->description ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="text-center">Belum ada transaksi simpanan</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <p>Laporan ini dihasilkan secara otomatis oleh sistem Koperasi Imigrasi.</p>
        <p>© {{ date('Y') }} Koperasi Karyawan Imigrasi. All rights reserved.</p>
    </div>
</body>
</html>