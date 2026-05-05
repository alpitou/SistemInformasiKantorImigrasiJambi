<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Perjanjian Pinjaman</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000000;
            background: #fff;
            padding: 40px 50px;
        }
        
        /* Kop Surat */
        .letterhead {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #000;
        }
        
        .letterhead .institution {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .letterhead .subtitle {
            font-size: 11pt;
            margin-top: 4px;
        }
        
        .letterhead .address {
            font-size: 10pt;
            margin-top: 4px;
        }
        
        .letterhead .motto {
            font-size: 9pt;
            font-style: italic;
            margin-top: 6px;
        }
        
        /* Judul Surat */
        .document-title {
            text-align: center;
            margin: 20px 0 10px 0;
        }
        
        .document-title .title {
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .document-title .subtitle {
            font-size: 11pt;
            margin-top: 5px;
        }
        
        .document-title .number {
            font-size: 11pt;
            margin-top: 3px;
        }
        
        /* Pembuka */
        .opening {
            margin: 20px 0;
            text-align: justify;
        }
        
        /* Tabel Data */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .data-table td {
            padding: 6px 8px;
            vertical-align: top;
        }
        
        .data-table td:first-child {
            width: 35%;
            font-weight: 500;
        }
        
        .data-table td:last-child {
            width: 65%;
        }
        
        /* Pasal / Klausul */
        .clause {
            margin: 20px 0;
        }
        
        .clause-title {
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .clause-content {
            text-align: justify;
            padding-left: 15px;
        }
        
        .clause-number {
            font-weight: bold;
            margin-right: 5px;
        }
        
        /* Tabel Perincian */
        .detail-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11pt;
        }
        
        .detail-table th,
        .detail-table td {
            border: 1px solid #000;
            padding: 8px 10px;
            text-align: left;
        }
        
        .detail-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
        }
        
        .detail-table td:last-child,
        .detail-table th:last-child {
            text-align: right;
        }
        
        .detail-table .text-center {
            text-align: center;
        }
        
        .detail-table .text-right {
            text-align: right;
        }
        
        /* Total Baris */
        .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        
        /* Paragraf */
        .paragraph {
            text-align: justify;
            margin: 12px 0;
            text-indent: 35px;
        }
        
        /* Penutup */
        .closing {
            margin: 30px 0 20px 0;
        }
        
        /* Tanda Tangan - SEMUA DI KANAN */
        .signature-wrapper {
            margin-top: 40px;
            display: flex;
            justify-content: flex-end;
        }
        
        .signature-container {
            width: 300px;
            text-align: center;
        }
        
        /* Materai di kanan atas tanda tangan */
        .stamp-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
        }
        
        .stamp-box {
            width: 120px;
            height: 100px;
            border: 2px dashed #999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fafafa;
        }
        
        .stamp-box span {
            font-size: 11pt;
            font-weight: bold;
            color: #333;
        }
        
        .stamp-box small {
            font-size: 8pt;
            color: #666;
        }
        
        .signature-line {
            margin-top: 60px;
            padding-top: 5px;
            border-top: 1px solid #000;
            width: 100%;
        }
        
        .signature-name {
            font-weight: bold;
            margin-top: 5px;
        }
        
        .signature-title {
            font-size: 10pt;
            margin-top: 3px;
        }
        
        .signature-date {
            font-size: 10pt;
            margin-bottom: 10px;
        }
        
        /* Mengetahui (tetap di kiri) */
        .acknowledge {
            margin-top: 30px;
            text-align: left;
        }
        
        .acknowledge-line {
            margin-top: 60px;
            width: 250px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            font-size: 9pt;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 15px;
            color: #666;
        }
        
        /* Page Break */
        .page-break {
            page-break-before: always;
        }
        
        /* List */
        .list {
            margin: 10px 0 10px 30px;
        }
        
        .list li {
            margin: 5px 0;
        }
        
        .clearfix {
            clear: both;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-left {
            text-align: left;
        }
        
        .float-right {
            float: right;
        }
    </style>
</head>
<body>

    <!-- Kop Surat -->
    <div class="letterhead">
        <div class="institution">KOPERASI KANTOR IMIGRASI KELAS I TPI JAMBI</div>
        <div class="subtitle">KOPERASI KARYAWAN KANTOR IMIGRASI KELAS I TPI JAMBI</div>
        <div class="address">
            Jalan HOS Cokroaminoto No. 79, Telanaipura, Kota Jambi - 36122<br>
            Telp: (0741) 12345 | Email: koperasi@imigrasi.go.id
        </div>
        <div class="motto">"Bersama Membangun Kesejahteraan"</div>
    </div>

    <!-- Judul Surat Perjanjian -->
    <div class="document-title">
        <div class="title">SURAT PERJANJIAN PINJAMAN</div>
        <div class="subtitle">(LOAN AGREEMENT)</div>
        <div class="number">Nomor: {{ sprintf('PJ/%03d/KOP-IM/JP/%s', $loan->id, date('Y')) }}</div>
    </div>

    <!-- Pembukaan -->
    <div class="opening">
        Pada hari ini, <strong>{{ \Carbon\Carbon::now()->locale('id')->isoFormat('dddd, D MMMM Y') }}</strong>, kami yang bertanda tangan di bawah ini:
    </div>

    <!-- Data Pihak Pertama (Peminjam) -->
    <table class="data-table">
        <tr>
            <td><strong>Nama Lengkap</strong></td>
            <td>: {{ $user->name }}</td>
        </tr>
        <tr>
            <td><strong>NIP / NIK</strong></td>
            <td>: {{ $user->nip ?? $user->nik ?? '-' }}</td>
        </tr>
        <tr>
            <td><strong>Tempat / Tgl Lahir</strong></td>
            <td>: {{ $user->birth_place ?? '-' }} / {{ $user->birth_date ? \Carbon\Carbon::parse($user->birth_date)->isoFormat('D MMMM Y') : '-' }}</td>
        </tr>
        <tr>
            <td><strong>Jabatan / Unit Kerja</strong></td>
            <td>: {{ $user->position ?? '-' }} / {{ $user->unit ?? '-' }}</td>
        </tr>
        <tr>
            <td><strong>Alamat</strong></td>
            <td>: {{ $user->address ?? '-' }}</td>
        </tr>
        <tr>
            <td><strong>No. Telepon/HP</strong></td>
            <td>: {{ $user->phone ?? '-' }}</td>
        </tr>
    </table>

    <div class="paragraph">
        Selanjutnya disebut sebagai <strong>PIHAK KESATU / PEMINJAM</strong>.
    </div>

    <div class="paragraph">
        Dengan ini mengajukan pinjaman kepada Koperasi Kantor Imigrasi Kelas I TPI Jambi yang beralamat di Jalan HOS Cokroaminoto No. 79, Telanaipura, Kota Jambi, dalam hal ini diwakili oleh <strong>Ketua Koperasi</strong>, selanjutnya disebut sebagai <strong>PIHAK KEDUA / KOPERASI</strong>.
    </div>

    <div class="paragraph">
        Para pihak terlebih dahulu menerangkan hal-hal sebagai berikut:
    </div>

    <!-- Pasal 1 -->
    <div class="clause">
        <div class="clause-title">Pasal 1: BESARAN PINJAMAN</div>
        <div class="clause-content">
            PIHAK KEDUA memberikan pinjaman kepada PIHAK KESATU sebesar 
            <strong>Rp {{ number_format($loan->amount, 0, ',', '.') }}</strong> 
            ({{ $this->terbilang($loan->amount) }} Rupiah).
        </div>
    </div>

    <!-- Pasal 2 -->
    <div class="clause">
        <div class="clause-title">Pasal 2: JANGKA WAKTU</div>
        <div class="clause-content">
            Pinjaman ini diberikan untuk jangka waktu selama <strong>{{ $loan->tenor_months }} ({{ $this->terbilang($loan->tenor_months) }}) bulan</strong>, terhitung sejak tanggal ditandatanganinya surat perjanjian ini.
        </div>
    </div>

    <!-- Pasal 3 -->
    <div class="clause">
        <div class="clause-title">Pasal 3: BUNGA DAN ANGSURAN</div>
        <div class="clause-content">
            <p>Atas pinjaman ini dikenakan bunga sebesar <strong>{{ $loan->interest_rate }}% ({{ $this->terbilang($loan->interest_rate) }} persen) flat</strong> per bulan dari jumlah pinjaman.</p>
            <br>
            <p>Perincian pinjaman sebagai berikut:</p>
        </div>
    </div>

    <!-- Tabel Perincian Pinjaman -->
    <table class="detail-table">
        <thead>
            <tr>
                <th width="5%" class="text-center">No</th>
                <th width="40%">Keterangan</th>
                <th width="25%" class="text-center">Per Bulan</th>
                <th width="30%" class="text-center">Total ({{ $loan->tenor_months }} Bulan)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-center">1</td>
                <td>Pokok Pinjaman</td>
                <td class="text-right">Rp {{ number_format($loan->amount / $loan->tenor_months, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($loan->amount, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="text-center">2</td>
                <td>Bunga Pinjaman ({{ $loan->interest_rate }}% flat per bulan)</td>
                <td class="text-right">Rp {{ number_format(($loan->amount * $loan->interest_rate / 100), 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format(($loan->amount * $loan->interest_rate / 100) * $loan->tenor_months, 0, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2" class="text-center"><strong>JUMLAH ANGSURAN</strong></td>
                <td class="text-right"><strong>Rp {{ number_format($monthlyInstallment, 0, ',', '.') }}</strong></td>
                <td class="text-right"><strong>Rp {{ number_format($totalPayment, 0, ',', '.') }}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="paragraph">
        PIHAK KESATU wajib membayar angsuran setiap bulan sebesar <strong>Rp {{ number_format($monthlyInstallment, 0, ',', '.') }}</strong> ({{ $this->terbilang($monthlyInstallment) }} Rupiah) yang dibayarkan paling lambat setiap tanggal <strong>25 (dua puluh lima)</strong> setiap bulannya melalui pemotongan gaji atau transfer ke rekening Koperasi.
    </div>

    <!-- Pasal 4 -->
    <div class="clause">
        <div class="clause-title">Pasal 4: TATA CARA PEMBAYARAN</div>
        <div class="clause-content">
            <ol class="list" style="list-style-type: lower-roman;">
                <li>Pembayaran angsuran dilakukan setiap bulan melalui pemotongan gaji PIHAK KESATU oleh bendahara Koperasi.</li>
                <li>Apabila PIHAK KESATU berhenti bekerja atau pensiun, maka seluruh sisa pinjaman menjadi jatuh tempo dan harus dilunasi seketika.</li>
                <li>Keterlambatan pembayaran angsuran akan dikenakan denda sebesar 0,5% per hari dari jumlah angsuran yang tertunda.</li>
            </ol>
        </div>
    </div>

    <!-- Pasal 5 -->
    <div class="clause">
        <div class="clause-title">Pasal 5: SANKSI</div>
        <div class="clause-content">
            Apabila PIHAK KESATU lalai atau tidak memenuhi kewajibannya sebagaimana telah ditentukan dalam perjanjian ini, maka PIHAK KEDUA berhak untuk:
            <ol class="list" style="list-style-type: lower-roman;">
                <li>Menagih seluruh sisa pinjaman sekaligus beserta bunga dan denda yang terhutang.</li>
                <li>Memblokir seluruh Simpanan PIHAK KESATU sebagai jaminan pelunasan pinjaman.</li>
            </ol>
        </div>
    </div>

    <!-- Pasal 6 -->
    <div class="clause">
        <div class="clause-title">Pasal 6: FORCE MAJEURE</div>
        <div class="clause-content">
            Para pihak tidak bertanggung jawab atas keterlambatan atau kegagalan dalam memenuhi kewajiban yang disebabkan oleh keadaan force majeure (bencana alam, kebakaran, kerusuhan, atau keadaan darurat lainnya) yang terjadi di luar kemampuan para pihak.
        </div>
    </div>

    <!-- Pasal 7 -->
    <div class="clause">
        <div class="clause-title">Pasal 7: PENYELESAIAN PERSELISIHAN</div>
        <div class="clause-content">
            Apabila terjadi perselisihan dalam pelaksanaan perjanjian ini, para pihak sepakat untuk menyelesaikannya secara musyawarah untuk mencapai mufakat. Apabila tidak tercapai penyelesaian, maka para pihak sepakat untuk menyelesaikannya melalui Pengadilan Negeri Jambi.
        </div>
    </div>

    <!-- Pasal 8 -->
    <div class="clause">
        <div class="clause-title">Pasal 8: PENUTUP</div>
        <div class="clause-content">
            Demikian surat perjanjian ini dibuat dan ditandatangani oleh kedua belah pihak dalam keadaan sehat jasmani dan rohani serta tanpa paksaan dari pihak manapun.
        </div>
    </div>

    <!-- Penutup -->
    <div class="closing">
        <div class="paragraph">
            Surat perjanjian ini dibuat rangkap 2 (dua) dan bermaterai cukup, masing-masing mempunyai kekuatan hukum yang sama.
        </div>
    </div>

    <!-- MATERAI - DI SEBELAH KANAN ATAS TANDA TANGAN -->
    <div class="stamp-wrapper">
        <div class="stamp-box">
            <span>Rp 10.000</span>
            <small>(Materai)</small>
        </div>
    </div>

    <!-- TANDA TANGAN PEMINJAM - DI SEBELAH KANAN -->
    <div class="signature-wrapper">
        <div class="signature-container">
            <div class="signature-date">Jambi, {{ \Carbon\Carbon::now()->locale('id')->isoFormat('D MMMM Y') }}</div>
            <div class="signature-line"></div>
            <div class="signature-name">{{ $user->name }}</div>
            <div class="signature-title">(Peminjam)</div>
        </div>
    </div>

    <!-- Mengetahui - TETAP DI SEBELAH KIRI -->
    <div class="acknowledge">
        <div>Mengetahui,</div>
        <div class="acknowledge-line"></div>
        <div>Ketua Koperasi Kantor Imigrasi Kelas I TPI Jambi</div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini ditandatangani secara elektronik. Surat perjanjian ini sah secara hukum.</p>
    </div>

</body>
</html>

<?php
/**
 * Helper function untuk mengkonversi angka ke teks (terbilang)
 */
if (!function_exists('terbilang')) {
    function terbilang($angka) {
        $angka = abs($angka);
        $baca = array('', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas');
        $terbilang = '';
        
        if ($angka < 12) {
            $terbilang = ' ' . $baca[$angka];
        } elseif ($angka < 20) {
            $terbilang = terbilang($angka - 10) . ' belas';
        } elseif ($angka < 100) {
            $terbilang = terbilang($angka / 10) . ' puluh' . terbilang($angka % 10);
        } elseif ($angka < 200) {
            $terbilang = ' seratus' . terbilang($angka - 100);
        } elseif ($angka < 1000) {
            $terbilang = terbilang($angka / 100) . ' ratus' . terbilang($angka % 100);
        } elseif ($angka < 2000) {
            $terbilang = ' seribu' . terbilang($angka - 1000);
        } elseif ($angka < 1000000) {
            $terbilang = terbilang($angka / 1000) . ' ribu' . terbilang($angka % 1000);
        } elseif ($angka < 1000000000) {
            $terbilang = terbilang($angka / 1000000) . ' juta' . terbilang($angka % 1000000);
        }
        
        return trim($terbilang) . ' ';
    }
}
?>