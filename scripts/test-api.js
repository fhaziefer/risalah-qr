// scripts/test-api.js

const API_URL = 'http://localhost:3000';

// Data dasar untuk testing (disesuaikan dengan kebutuhan struktur surat)
const baseData = {
  kodeKepengurusan: 'PP',
  kodeSurat: 'A',
  tingkatKepengurusan: 'Pusat',
  daerahKepengurusan: 'Nasional',
  ketua: 'Ketua Umum',
  ketuaName: 'Ahmad Fulan',
  sekretaris: 'Sekretaris Jenderal',
  sekretarisName: 'Yusuf Fadlulloh',
};

async function testSingleQR() {
  console.log('⏳ Testing Single QR Generation...');
  try {
    const response = await fetch(`${API_URL}/generateQR`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseData,
        nomorSurat: '001',
      }),
    });

    const data = await response.json();
    console.log('✅ Response Single QR:', JSON.stringify(data, null, 2));
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('❌ Error Single QR:', error.message);
  }
}

async function testBulkQR() {
  console.log('⏳ Testing Bulk QR Generation...');
  try {
    const response = await fetch(`${API_URL}/generateQR/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseData,
        nomorSurat: ['002', '003'],
      }),
    });

    const data = await response.json();
    console.log('✅ Response Bulk QR:', JSON.stringify(data, null, 2));
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('❌ Error Bulk QR:', error.message);
  }
}

// Jalankan semua test secara berurutan
async function runTests() {
  console.log('🚀 MEMULAI API TESTING...\n');
  await testSingleQR();
  await testBulkQR();
  console.log('🏁 TESTING SELESAI.');
}

runTests();
