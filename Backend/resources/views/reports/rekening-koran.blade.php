<!-- resources/views/reports/rekening-koran.blade.php -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Rekening Koran - {{ $member->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            padding: 20px;
        }
        
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        
        .header h1 {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .header h2 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 10px;
        }
        
        .period {
            text-align: right;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .confidential {
            text-align: center;
            color: red;
            font-weight: bold;
            text-transform: uppercase;
            margin: 10px 0;
        }
        
        .section {
            margin-bottom: 20px;
            border: 1px solid #000;
            padding: 10px;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 12px;
            background-color: #f0f0f0;
            padding: 5px;
            margin-bottom: 10px;
            text-align: center;
            text-transform: uppercase;
        }
        
        .info-grid {
            width: 100%;
        }
        
        .info-row {
            margin-bottom: 8px;
        }
        
        .info-label {
            display: inline-block;
            width: 120px;
            font-weight: bold;
        }
        
        .info-value {
            display: inline-block;
        }
        
        .investment-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .investment-table th,
        .investment-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        .investment-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-bold {
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
            font-size: 9px;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        
        .signature {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
        
        .signature-box {
            text-align: center;
            width: 45%;
        }
        
        .signature-line {
            margin-top: 50px;
            border-top: 1px solid #000;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
        }
        
        hr {
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>KOPERASI PENGAYOMAN KARYAWAN</h1>
            <h2>KEMENTERIAN HUKUM DAN HAM KANTOR WILAYAH RIAU</h2>
            <p>Jl. M. Yamin No. 12, Pekanbaru - Riau</p>
        </div>
        
        <div class="period">
            PERIODE : {{ strtoupper($month) }}
        </div>
        
        <div class="confidential">
            CONFIDENTIAL
        </div>
        
        <!-- Informasi Anggota -->
        <div class="section">
            <div class="section-title">INFORMASI ANGGOTA</div>
            <div class="info-grid">
                <div class="info-row">
                    <span class="info-label">NAMA</span>
                    <span class="info-value">{{ strtoupper($member->name) }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">NIP</span>
                    <span class="info-value">{{ $member->nip ?? '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">JABATAN</span>
                    <span class="info-value">{{ $member->position ?? '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">GOL</span>
                    <span class="info-value">{{ $member->rank ?? '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">TTL</span>
                    <span class="info-value">{{ $member->birth_place ?? '-' }}, {{ $member->birth_date ?? '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">ALAMAT</span>
                    <span class="info-value">{{ $member->address ?? $member->unit ?? '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">NO. TLPN</span>
                    <span class="info-value">{{ $member->phone ?? '-' }}</span>
                </div>
            </div>
        </div>
        
        <!-- Informasi Investasi Anggota -->
        <div class="section">
            <div class="section-title">INFORMASI INVESTASI ANGGOTA</div>
            <table class="investment-table">
                <tr>
                    <td width="70%">Jumlah Simpanan Pokok</td>
                    <td width="30%" class="text-right">Rp {{ number_format($pokok_balance, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Jumlah Simpanan Wajib</td>
                    <td class="text-right">Rp {{ number_format($wajib_balance, 0, ',', '.') }}</td>
                </tr>
                <tr style="background-color: #f0f0f0;">
                    <td><strong>Total Investasi Anggota</strong></td>
                    <td class="text-right"><strong>Rp {{ number_format($total_savings, 0, ',', '.') }}</strong></td>
                </tr>
                <tr>
                    <td>Pengembalian SHU</td>
                    <td class="text-right">Rp {{ number_format($shu_total, 0, ',', '.') }}</td>
                </tr>
                <tr style="background-color: #e0e0e0;">
                    <td><strong>TOTAL INVESTASI</strong></td>
                    <td class="text-right"><strong>Rp {{ number_format($total_savings + $shu_total, 0, ',', '.') }}</strong></td>
                </tr>
            </table>
        </div>
        
        <!-- Informasi Pembiayaan Anggota -->
        <div class="section">
            <div class="section-title">INFORMASI PEMBIAYAAN ANGGOTA</div>
            
            @if($has_loan)
            <table class="investment-table">
                <tr>
                    <td width="70%">FASILITAS PEMBIAYAAN</td>
                    <td width="30%" class="text-center">AKTIF</td>
                </tr>
                <tr>
                    <td>Jumlah Pembiayaan</td>
                    <td class="text-right">Rp {{ number_format($loan_amount, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Tenor</td>
                    <td class="text-right">{{ $tenor }} Bulan</td>
                </tr>
                <tr>
                    <td>Angsuran Per/Bulan</td>
                    <td class="text-right">Rp {{ number_format($monthly_installment, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Sisa Saldo Pembiayaan</td>
                    <td class="text-right">Rp {{ number_format($remaining_balance, 0, ',', '.') }}</td>
                </tr>
            </table>
            @else
            <table class="investment-table">
                <tr>
                    <td class="text-center">TIDAK ADA PEMBIAYAAN AKTIF</td>
                </tr>
            </table>
            @endif
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Rekening Koran ini merupakan dokumen resmi yang dikeluarkan oleh Koperasi, memuat semua informasi keanggotaan pada Koperasi.</p>
            <p>Dokumen ini sebagai pengganti Kartu Tanda Anggota, Kartu Simpanan Anggota dan Kartu Pinjaman Anggota.</p>
            <hr>
            <p>Dicetak: {{ $generated_at->format('d/m/Y H:i:s') }}</p>
        </div>
        
        <!-- Tanda Tangan -->
        <div class="signature">
            <div class="signature-box">
                <div class="signature-line"></div>
                <p class="text-bold">Anggota</p>
                <p>({{ $member->name }})</p>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <p class="text-bold">Bendahara Koperasi</p>
                <p>___________________</p>
            </div>
        </div>
    </div>
</body>
</html>