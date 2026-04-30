<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Surat Perjanjian Pinjaman - {{ $user->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', 'Helvetica', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1a1a1a;
            background: white;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1a3c6e;
        }
        
        .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #1a3c6e;
            text-transform: uppercase;
        }
        
        .header h2 {
            font-size: 14px;
            font-weight: normal;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        
        .header p {
            font-size: 10px;
            color: #666;
        }
        
        /* Title */
        .title {
            text-align: center;
            margin: 20px 0;
        }
        
        .title h3 {
            font-size: 14px;
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
        }
        
        /* Content */
        .content {
            margin: 15px 0;
        }
        
        .content p {
            margin-bottom: 10px;
            text-align: justify;
        }
        
        /* Table */
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .table th,
        .table td {
            border: 1px solid #000;
            padding: 10px;
            vertical-align: top;
        }
        
        .table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: left;
            width: 30%;
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
        
        /* Parties */
        .party-section {
            margin: 15px 0;
        }
        
        .party {
            margin-bottom: 15px;
        }
        
        .party-line {
            margin: 5px 0;
        }
        
        /* Signature Section - HANYA PEMINJAM DI KANAN */
        .signature-wrapper {
            margin-top: 40px;
            display: flex;
            justify-content: flex-end;
        }
        
        .signature-box {
            text-align: center;
            width: 40%;
        }
        
        .signature-line {
            margin-top: 50px;
            border-top: 1px solid #1a1a1a;
            width: 100%;
        }
        
        .signature-name {
            margin-top: 8px;
            font-weight: bold;
            font-size: 11px;
        }
        
        .signature-title {
            margin-top: 5px;
            font-size: 10px;
            color: #555;
        }
        
        /* ============================================ */
        /* MATERAI DIGITAL Rp 10.000                    */
        /* ============================================ */
        .stamp-wrapper {
            margin: 30px 0 20px 0;
            display: flex;
            justify-content: flex-start;
        }
        
        .stamp-box {
            width: 160px;
            height: 160px;
            border: 2px dashed #c0392b;
            border-radius: 8px;
            background-color: #fef9e6;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .stamp-text {
            font-size: 11px;
            font-weight: bold;
            color: #c0392b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stamp-price {
            font-size: 16px;
            font-weight: bold;
            color: #c0392b;
            margin: 5px 0;
        }
        
        .digital-sign-area {
            margin-top: 10px;
            border-top: 1px dashed #e67e22;
            padding: 6px;
            text-align: center;
            width: 90%;
        }
        
        .digital-sign-text {
            font-size: 7px;
            color: #e67e22;
            background: #fff;
            padding: 3px;
            border-radius: 3px;
        }
        
        /* Date */
        .date {
            text-align: right;
            margin: 20px 0;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        
        @media print {
            body {
                padding: 0;
                margin: 0;
            }
            .stamp-box {
                border: 2px dashed #c0392b !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <h1>KOPERASI KARYAWAN IMIGRASI</h1>
            <h2>KANTOR IMIGRASI KELAS I TPI JAMBI</h2>
            <p>Jl. Jend. Sudirman No. 123, Kota Jambi - Jambi 36122</p>
            <p>Email: koperasi@kanimjambi.go.id | Website: https://kanimjambi.imigrasi.go.id</p>
        </div>

        <!-- TITLE -->
        <div class="title">
            <h3>SURAT PERJANJIAN PINJAMAN</h3>
            <p>Nomor: {{ $loan->id }}/KOP-IM/{{ date('m') }}/{{ date('Y') }}</p>
        </div>

        <!-- OPENING -->
        <div class="content">
            <p>Pada hari ini, <strong>{{ \Carbon\Carbon::now()->locale('id')->isoFormat('dddd, D MMMM YYYY') }}</strong>, kami yang bertanda tangan di bawah ini:</p>
        </div>

        <!-- PIHAK PERTAMA (Peminjam) -->
        <div class="party-section">
            <div class="party">
                <div class="party-line"><strong>Nama</strong> : {{ $user->name }}</div>
                <div class="party-line"><strong>NIP / NIK</strong> : {{ $user->nip ?? '-' }}</div>
                <div class="party-line"><strong>Unit Kerja</strong> : {{ $user->unit ?? '-' }}</div>
                <div class="party-line"><strong>No. Telepon</strong> : {{ $user->phone ?? '-' }}</div>
                <div class="party-line"><em>Selanjutnya disebut sebagai <strong>PIHAK PERTAMA / PEMINJAM</strong></em></div>
            </div>
        </div>

        <!-- CONTENT -->
        <div class="content">
            <p>Dengan ini mengajukan pinjaman kepada <strong>Koperasi Karyawan Imigrasi Kantor Imigrasi Kelas I TPI Jambi</strong>, dengan ketentuan sebagai berikut:</p>
        </div>

        <!-- LOAN DETAILS TABLE -->
        <table class="table">
            <tr>
                <th>Jumlah Pinjaman</th>
                <td class="text-right">Rp {{ number_format($loan->amount, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <th>Suku Bunga</th>
                <td class="text-right">{{ $loan->interest_rate }}% flat</td>
            </tr>
            <tr>
                <th>Jangka Waktu</th>
                <td class="text-right">{{ $loan->tenor_months }} bulan</td>
            </tr>
            <tr>
                <th>Angsuran per Bulan</th>
                <td class="text-right">Rp {{ number_format($loan->monthly_installment, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <th>Total Pembayaran</th>
                <td class="text-right">Rp {{ number_format($loan->monthly_installment * $loan->tenor_months, 0, ',', '.') }}</td>
            </tr>
        </table>

        <!-- TERMS -->
        <div class="content">
            <p><strong>Ketentuan:</strong></p>
            <ol style="margin-left: 25px; margin-top: 5px;">
                <li>PIHAK PERTAMA setuju untuk membayar angsuran setiap bulan melalui pemotongan gaji atau transfer ke rekening koperasi.</li>
                <li>Pembayaran angsuran dilakukan paling lambat tanggal 25 setiap bulan.</li>
                <li>Apabila terjadi keterlambatan pembayaran, PIHAK PERTAMA dikenakan denda sesuai ketentuan yang berlaku.</li>
                <li>Perjanjian ini berlaku sejak ditandatangani oleh kedua belah pihak.</li>
            </ol>
        </div>

        <!-- ============================================================ -->
        <!-- MATERAI DIGITAL Rp 10.000 - SEBELAH KIRI                     -->
        <!-- ============================================================ -->
        <div class="stamp-wrapper">
            <div class="stamp-box">
                <div class="stamp-text">MATERAI</div>
                <div class="stamp-price">Rp 10.000</div>
                <div class="stamp-text">TEMPEL</div>
                <div class="digital-sign-area">
                    <div class="digital-sign-text">
                        ⚡ DIGITAL SIGNATURE ZONE ⚡<br>
                        <span style="font-size: 6px;">(Tanda tangan digital / e-Materai)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- DATE -->
        <div class="date">
            <p>Jambi, {{ \Carbon\Carbon::now()->locale('id')->isoFormat('D MMMM YYYY') }}</p>
        </div>

        <!-- ============================================================ -->
        <!-- TANDA TANGAN PEMINJAM (SEBELAH KANAN) - TANPA KETUA          -->
        <!-- ============================================================ -->
        <div class="signature-wrapper">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-name">{{ $user->name }}</div>
                <div class="signature-title">Peminjam / PIHAK PERTAMA</div>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <p>Surat Perjanjian ini dibuat dalam rangkap 2 (dua) dan mempunyai kekuatan hukum yang sama.</p>
            <p>Dicetak: {{ \Carbon\Carbon::now()->format('d/m/Y H:i:s') }}</p>
        </div>
    </div>
</body>
</html>