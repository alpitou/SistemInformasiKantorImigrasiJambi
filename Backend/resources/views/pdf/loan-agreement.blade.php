{{-- resources/views/pdf/loan-agreement.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Perjanjian Pinjaman</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 18px; font-weight: bold; text-decoration: underline; }
        .content { margin-top: 20px; line-height: 1.6; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-line { margin-top: 50px; width: 200px; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SURAT PERJANJIAN PINJAMAN</div>
        <div>Koperasi Kantor Imigrasi Kelas I TPI Jambi</div>
        <div>Nomor: PJ/{{ $loan->id }}/{{ date('Y') }}</div>
    </div>
    
    <div class="content">
        <p>Pada hari ini, {{ $date }}, kami yang bertanda tangan di bawah ini:</p>
        
        <table>
            <tr>
                <td width="30%"><strong>Nama</strong></td>
                <td>: {{ $user->name }}</td>
            </tr>
            <tr>
                <td><strong>NIP / NIK</strong></td>
                <td>: {{ $user->nip ?? $user->nik }}</td>
            </tr>
            <tr>
                <td><strong>Unit Kerja</strong></td>
                <td>: {{ $user->unit }}</td>
            </tr>
            <tr>
                <td><strong>No. Telepon</strong></td>
                <td>: {{ $user->phone ?? '-' }}</td>
            </tr>
        </table>
        
        <p>Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>
        
        <p>Dengan ini mengajukan pinjaman kepada Koperasi Kantor Imigrasi Kelas I TPI Jambi, dengan ketentuan sebagai berikut:</p>
        
        <table>
            <tr>
                <td width="50%">Jumlah Pinjaman</td>
                <td>: Rp {{ number_format($loan->amount, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Suku Bunga</td>
                <td>: {{ $loan->interest_rate }}% flat</td>
            </tr>
            <tr>
                <td>Jangka Waktu</td>
                <td>: {{ $loan->tenor_months }} bulan</td>
            </tr>
            <tr>
                <td>Angsuran per Bulan</td>
                <td>: Rp {{ number_format($monthlyInstallment, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Total Pembayaran</td>
                <td>: Rp {{ number_format($totalPayment, 0, ',', '.') }}</td>
            </tr>
        </table>
        
        <p>PIHAK PERTAMA setuju untuk membayar angsuran setiap bulan melalui pemotongan gaji atau transfer ke rekening koperasi.</p>
        
        <p>Demikian surat perjanjian ini dibuat dengan sebenar-benarnya untuk dapat digunakan sebagaimana mestinya.</p>
    </div>
    
    <div class="signature">
        <div>
            <p>Mengetahui,<br/>Ketua Koperasi</p>
            <div class="signature-line">(_________________)</div>
        </div>
        <div>
            <p>Jambi, {{ $date }}<br/>Peminjam,</p>
            <div class="signature-line">{{ $user->name }}</div>
        </div>
    </div>
</body>
</html>