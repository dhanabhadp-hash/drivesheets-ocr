'use client';

import { useState, useEffect } from 'react';

const GAS_ENDPOINT = 'YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

export default function InvoiceDashboard() {
  const [files, setFiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // โหลดข้อมูลประวัติจาก Google Sheets DB
  const fetchRecords = async () => {
    try {
      const res = await fetch(GAS_ENDPOINT);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch DB records:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // แปลงไฟล์เป็น Base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  // ประมวลผลการอัปโหลดไฟล์ (รองรับ Multi-files)
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!files.length) return;

    setLoading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64Data = await fileToBase64(file);

      const payload = {
        fileName: file.name,
        mimeType: file.type,
        fileData: base64Data
      };

      try {
        await fetch(GAS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
      }
    }

    setLoading(false);
    setFiles([]);
    fetchRecords(); // Refresh ตารางเมื่อเสร็จสิ้น
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <h1 className="text-3xl font-bold text-gray-800">ระบบจัดการและอ่านใบกำกับสินค้า (OCR INV.)</h1>

      {/* 🚀 Feature 1: File Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-xl font-semibold mb-4">อัปโหลดเอกสาร (ภาพ / PDF)</h2>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            type="submit"
            disabled={loading || !files.length}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'กำลังประมวลผล OCR...' : 'เริ่มต้นอ่านเอกสาร'}
          </button>
        </form>
      </div>

      {/* 📊 Feature 2: Data & Image Viewer Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">ประวัติและข้อมูลที่บันทึก (Google Sheets DB)</h2>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3">รูปภาพ</th>
              <th className="p-3">Invoice No</th>
              <th className="p-3">ชื่อบริษัท</th>
              <th className="p-3">Tax ID</th>
              <th className="p-3">ชื่อสินค้า</th>
              <th className="p-3">จำนวน</th>
              <th className="p-3">ราคารวม (Inc. VAT)</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  {item['Image URL'] ? (
                    <img
                      src={item['Image URL']}
                      alt="Invoice Thumbnail"
                      className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition"
                      onClick={() => setSelectedImage(item['Image URL'])}
                    />
                  ) : (
                    <span className="text-gray-400">ไม่มีรูป</span>
                  )}
                </td>
                <td className="p-3 font-medium">{item['Invoice No']}</td>
                <td className="p-3">{item['Company Name']}</td>
                <td className="p-3">{item['Tax ID']}</td>
                <td className="p-3">{item['Product Name']}</td>
                <td className="p-3">{item['Quantity']}</td>
                <td className="p-3 font-semibold text-green-700">
                  {Number(item['Grand Total (Incl. VAT)']).toLocaleString()} ฿
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔍 Lightbox Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Full View" className="max-w-full max-h-[90vh] rounded shadow-2xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 text-xs font-bold"
            >
              ✕ ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
