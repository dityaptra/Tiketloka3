'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { Trash2, Calendar, MapPin, Loader2, ShoppingCart } from 'lucide-react'; // Tambah icon ShoppingCart
import { CartItem } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CartPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth(); // Ambil loading status juga
  
  const [carts, setCarts] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // --- FUNGSI HELPER UNTUK GAMBAR (Sama seperti di Tiket) ---
  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://images.unsplash.com/photo-1596423348633-8472df3b006c?auto=format&fit=crop&w=800';
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000/storage/${url}`;
  };
  // ---------------------------------------------------------

  // 1. Fetch Data Cart
  useEffect(() => {
    if (authLoading) return; // Tunggu auth selesai cek

    const fetchCart = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:8000/api/cart', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        
        const json = await res.json();
        if (res.ok) {
            setCarts(json.data);
        } else if (res.status === 401) {
            router.push('/login');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [token, authLoading, router]);

  // 2. Fungsi Hapus Item
  const handleDelete = async (id: number) => {
    if(!confirm('Hapus item ini?')) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/cart/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
      });
      setCarts(carts.filter(item => item.id !== id));
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } catch (error) {
      alert('Gagal menghapus');
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const grandTotal = carts
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.total_price, 0);

  // 3. Logic Checkout
  const handleCheckout = async () => {
    if (selectedIds.length === 0) return alert('Pilih minimal 1 item!');
    
    setIsCheckingOut(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/checkout', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart_ids: selectedIds,
          payment_method: paymentMethod
        })
      });

      const json = await res.json();

      if (res.ok) {
        router.push(`/tickets/${json.booking_code}`);
      } else {
        alert('Checkout Gagal: ' + json.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading || authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-[#F57C00]"/></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <Navbar />
      
      <div className="max-w-4xl mx-auto pt-24 px-4">
        <h1 className="text-3xl font-bold text-[#0B2F5E] mb-8">Keranjang Belanja</h1>

        {carts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 mb-4 font-medium">Keranjang Anda masih kosong.</p>
            <Link href="/" className="text-[#F57C00] font-bold hover:underline">Jelajahi Wisata</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* LIST ITEM */}
            <div className="flex-1 space-y-4">
              {carts.map((item) => (
                <div key={item.id} className={`bg-white p-4 rounded-2xl border transition-all flex gap-4 ${selectedIds.includes(item.id) ? 'border-[#F57C00] shadow-md ring-1 ring-[#F57C00]/20' : 'border-gray-100 shadow-sm'}`}>
                  
                  {/* Checkbox */}
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-[#F57C00] cursor-pointer"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </div>

                  {/* --- GAMBAR DENGAN HELPER --- */}
                  <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                    <img 
                        src={getImageUrl(item.destination.image_url)} 
                        alt={item.destination.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596423348633-8472df3b006c?auto=format&fit=crop&w=800';
                        }}
                    />
                  </div>
                  {/* ---------------------------- */}

                  {/* Detail */}
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0B2F5E] line-clamp-1">{item.destination.name}</h3>
                    <div className="flex flex-col text-xs text-gray-500 mt-2 gap-1.5">
                      <div className="flex items-center gap-1.5 bg-gray-50 w-fit px-2 py-1 rounded-md border border-gray-100">
                         <Calendar className="w-3 h-3 text-gray-400" /> {item.visit_date}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <MapPin className="w-3 h-3 text-gray-400" /> {item.quantity} Tiket
                      </div>
                    </div>
                    <p className="text-[#F57C00] font-bold mt-2 text-lg">Rp {item.total_price.toLocaleString('id-ID')}</p>
                  </div>

                  {/* Hapus */}
                  <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 h-fit transition-colors p-1">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* CHECKOUT BOX (Sticky) */}
            <div className="lg:w-80 h-fit bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
              <h3 className="font-bold text-[#0B2F5E] mb-4">Ringkasan Belanja</h3>
              
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Total Item ({selectedIds.length})</span>
                <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="border-t border-dashed my-4"></div>

              {/* Pilih Metode Bayar */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Metode Bayar</p>
                <div className="space-y-2">
                    {[
                        {val: 'qris', label: 'QRIS (Instant)'}, 
                        {val: 'transfer', label: 'Bank Transfer'}, 
                        {val: 'cod', label: 'Bayar di Lokasi'}
                    ].map(method => (
                        <label key={method.val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-sm transition-all ${paymentMethod === method.val ? 'border-[#F57C00] bg-orange-50 ring-1 ring-[#F57C00]/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="pay" 
                                value={method.val} 
                                checked={paymentMethod === method.val} 
                                onChange={e => setPaymentMethod(e.target.value)} 
                                className="accent-[#F57C00] w-4 h-4"
                            />
                            <span className="font-medium text-gray-700">{method.label}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-700">Grand Total</span>
                <span className="text-xl font-extrabold text-[#F57C00]">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={selectedIds.length === 0 || isCheckingOut}
                className="w-full bg-[#0B2F5E] hover:bg-[#061A35] text-white font-bold py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              >
                {isCheckingOut ? <Loader2 className="animate-spin w-5 h-5"/> : 'Checkout Sekarang'}
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}