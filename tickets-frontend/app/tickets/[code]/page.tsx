'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; 
import { Booking } from '@/types';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MapPin, Calendar, Download, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const bookingCode = params.code as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // --- FUNGSI HELPER URL GAMBAR (SAMA SEPERTI DI TIKET SAYA & CART) ---
  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://images.unsplash.com/photo-1596423348633-8472df3b006c?auto=format&fit=crop&w=800';
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000/storage/${url}`;
  };
  // -------------------------------------------------------------------

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
        router.push('/login');
        return;
    }

    if(!bookingCode) return;

    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/bookings/${bookingCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const json = await res.json();
        
        if (res.ok) {
            setBooking(json.data);
        } else {
            console.error(json.message);
            if(res.status === 401 || res.status === 403) {
                alert("Akses ditolak atau sesi habis.");
                router.push('/login');
            }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [bookingCode, token, authLoading, router]);

  if (loading || authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-[#F57C00]"/></div>;
  if (!booking) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 font-bold">Tiket tidak ditemukan</div>;

  return (
    <main className="min-h-screen bg-[#0B2F5E]">
      <div className="p-4 text-white fixed top-0 w-full z-10 bg-[#0B2F5E] shadow-md">
        <Link href="/tickets" className="flex items-center gap-2 font-medium hover:text-orange-300 w-fit">
          <ArrowLeft className="w-5 h-5" /> Kembali
        </Link>
      </div>

      <div className="px-4 pt-24 pb-10 min-h-screen flex items-center justify-center">
        <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
          
          {/* Header Sukses */}
          <div className="bg-green-50 p-6 text-center border-b border-dashed border-gray-200">
             <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
             </div>
             <h1 className="text-xl font-bold text-gray-800">Pembayaran Berhasil!</h1>
             <p className="text-gray-500 text-xs mt-1">Scan QR ini di pintu masuk wisata.</p>
          </div>

          {/* Area QR Code */}
          <div className="p-8 flex flex-col items-center justify-center bg-white relative">
            {/* Hiasan Lubang Tiket */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0B2F5E] rounded-full"></div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0B2F5E] rounded-full"></div>

            <div className="border-4 border-gray-800 p-2 rounded-xl">
              <QRCodeSVG 
                value={booking.qr_string}
                size={180}
                level={"H"}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            
            <p className="mt-4 font-mono font-bold text-2xl text-gray-700 tracking-widest">
              {booking.booking_code}
            </p>
          </div>

          {/* Rincian Pesanan */}
          <div className="bg-gray-50 p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Rincian Pesanan</h3>
            
            <div className="space-y-4">
              {booking.details.map((detail, idx) => (
                <div key={idx} className="flex gap-4">
                  {/* Container Gambar */}
                  <div className="h-14 w-14 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 relative border border-gray-300">
                    <img 
                        // GUNAKAN HELPER DISINI
                        src={getImageUrl(detail.destination.image_url)} 
                        alt={detail.destination.name}
                        className="w-full h-full object-cover"
                        // Tambahkan onError sebagai cadangan terakhir
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596423348633-8472df3b006c?auto=format&fit=crop&w=800';
                        }}
                    />
                  </div>
                  
                  {/* Detail Text */}
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{detail.destination.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" /> {detail.visit_date}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                       <MapPin className="w-3 h-3" /> {detail.quantity} Orang
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Bayar */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
               <span className="text-gray-500 text-sm">Total Bayar</span>
               <span className="text-lg font-bold text-[#F57C00]">
                  Rp {Number(booking.grand_total).toLocaleString('id-ID')}
               </span>
            </div>
          </div>
          
          {/* Tombol Simpan */}
          <div className="p-4 bg-white">
            <button className="w-full border border-gray-300 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-transform">
                <Download className="w-4 h-4" /> Simpan Tiket
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}