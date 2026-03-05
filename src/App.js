import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  initializeFirestore,
  setDoc
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  ShoppingBag, 
  User, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle,
  ChevronLeft,
  Search, 
  Upload, 
  Star, 
  Lock, 
  Key, 
  Layers, 
  Wand2, 
  Instagram,
  Phone,
  LayoutDashboard,
  ArrowRight,
  Loader2,
  MapPin,
  Mail,
  Download,
  Calendar,
  ShieldAlert
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyA8ncdjMeCTu7JEbcP-4JCVEX_-cfq8xh8",
  authDomain: "tabungan-a85ae.firebaseapp.com",
  projectId: "tabungan-a85ae",
  storageBucket: "tabungan-a85ae.firebasestorage.app",
  messagingSenderId: "502871375543",
  appId: "1:502871375543:web:5617b49ea6a25782ff5732",
  measurementId: "G-NV2L9GZM6T"
};

const appId = "devi-official-premium-production-v1";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const storage = getStorage(app);

// Load jsPDF from CDN for Receipt generation
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

const BANK_LOGOS = {
  "BCA": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
  "BRI": "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_Logo.svg",
  "Mandiri": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
  "CIMB Niaga": "https://upload.wikimedia.org/wikipedia/commons/5/5e/CIMB_Niaga_logo.svg",
  "DANA": "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dan_automotive.png",
  "OVO": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg",
  "GoPay": "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg"
};

const CATEGORIES = ['Baju', 'Dress', 'Hijab', 'Abaya', 'Koko', 'Set Keluarga', 'Tas'];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', 'All Size'];

const formatIDR = (amount) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

export default function App() {
  const [view, setView] = useState('shop'); 
  const [user, setUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminCreds, setAdminCreds] = useState(null); 
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [rekening, setRekening] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error("Auth Fail", err); }
      finally { setTimeout(() => setLoading(false), 1000); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const pRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const rRef = collection(db, 'artifacts', appId, 'public', 'data', 'rekening');
    const oRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const aRef = collection(db, 'artifacts', appId, 'public', 'data', 'admin_settings');

    const unsubP = onSnapshot(pRef, (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubR = onSnapshot(rRef, (s) => setRekening(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubO = onSnapshot(oRef, (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubA = onSnapshot(aRef, (s) => {
      const found = s.docs.find(d => d.id === 'main');
      if (found) setAdminCreds(found.data());
      else setAdminCreds({ username: 'admin', password: 'admin123' });
    });
    
    return () => { unsubP(); unsubR(); unsubO(); unsubA(); };
  }, [user]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, categoryFilter, searchTerm]);

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="font-serif tracking-[0.6em] animate-pulse text-2xl text-[#D4AF37] italic uppercase">DEVI OFFICIAL</div>
      <div className="w-40 h-[1px] bg-[#D4AF37]/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-[#D4AF37] animate-progress-line"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#1A1A1A] font-sans selection:bg-[#D4AF37] selection:text-black">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-4 md:px-8 h-20 md:h-24">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex-1 hidden lg:flex items-center gap-8">
            <button onClick={() => { setView('shop'); setCategoryFilter('All'); }} className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-all border-none bg-transparent cursor-pointer">Collections</button>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#D4AF37] transition-colors" size={14} />
              <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-zinc-100 border-none rounded-full pl-10 pr-6 py-2.5 text-[10px] w-40 focus:w-64 transition-all outline-none font-medium" />
            </div>
          </div>
          <div className="flex-1 flex justify-center text-black">
            <h1 className="text-xl md:text-3xl font-serif tracking-[0.4em] font-bold cursor-pointer uppercase select-none" onClick={() => setView('shop')}>DEVI<span className="text-[#D4AF37]">_OFFICIAL</span></h1>
          </div>
          <div className="flex-1 flex justify-end gap-3 md:gap-6 items-center">
             <button onClick={() => setView('cart')} className="relative p-2 hover:bg-zinc-100 rounded-full transition-all border-none bg-transparent cursor-pointer">
               <ShoppingBag size={20} />
               {cart.length > 0 && <span className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">{cart.length}</span>}
             </button>
             
             {/* LOGIN BADGE (RESTORED) */}
             <div className="hidden sm:flex items-center gap-3">
                <div className="bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-100 flex items-center gap-2">
                   <User size={14} className="text-[#D4AF37]" />
                   <span className="text-[9px] font-bold uppercase text-zinc-500">
                      {isAdminLoggedIn ? "Admin" : "Guest"}
                   </span>
                </div>
             </div>

             {isAdminLoggedIn ? (
               <button onClick={() => setView('admin')} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-[9px] font-bold tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg border-none cursor-pointer">
                 <LayoutDashboard size={14} /> <span className="hidden md:inline">ADMIN</span>
               </button>
             ) : (
               <button onClick={() => setView('login')} className="p-2 hover:bg-zinc-100 rounded-full transition-all border-none bg-transparent cursor-pointer">
                 <Key size={20} />
               </button>
             )}
          </div>
        </div>
      </header>

      <main>
        {view === 'shop' && (
          <>
            <section className="relative h-[60vh] md:h-[90vh] flex items-center justify-center overflow-hidden bg-black text-white">
              <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Hero" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
              <div className="relative z-10 text-center px-6 max-w-4xl">
                <p className="text-[10px] uppercase tracking-[1.5em] mb-12 font-bold text-[#D4AF37]">Premium Boutique</p>
                <h2 className="text-5xl md:text-9xl font-serif mb-12 italic tracking-tighter font-bold uppercase leading-none text-white">Luxury <br/> <span className="text-[#D4AF37]">Collection</span></h2>
                <button onClick={() => window.scrollTo({top: 800, behavior: 'smooth'})} className="mt-6 px-16 py-6 bg-[#D4AF37] text-black text-[11px] font-bold uppercase tracking-[0.6em] rounded-full hover:scale-105 transition-all shadow-2xl border-none cursor-pointer">Shop Now</button>
              </div>
            </section>
            
            <div className="bg-white border-b border-zinc-100 sticky top-20 md:top-24 z-40 overflow-x-auto no-scrollbar">
              <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-start md:justify-center gap-8 whitespace-nowrap">
                <button onClick={() => setCategoryFilter('All')} className={`text-[10px] uppercase font-bold tracking-[0.4em] transition-all px-6 py-2 rounded-full whitespace-nowrap border-none cursor-pointer ${categoryFilter === 'All' ? 'bg-black text-[#D4AF37]' : 'text-zinc-400 hover:text-black bg-transparent'}`}>Semua</button>
                {CATEGORIES.map(c => <button key={c} onClick={() => setCategoryFilter(c)} className={`text-[10px] uppercase font-bold tracking-[0.4em] transition-all px-6 py-2 rounded-full whitespace-nowrap border-none cursor-pointer ${categoryFilter === c ? 'bg-black text-[#D4AF37]' : 'text-zinc-400 hover:text-black bg-transparent'}`}>{c}</button>)}
              </div>
            </div>
            <ProductGrid products={filteredProducts} onView={(p) => { setSelectedProduct(p); setView('detail'); window.scrollTo(0,0); }} />
          </>
        )}

        {view === 'detail' && selectedProduct && (
          <ProductDetailView 
            product={selectedProduct} 
            onBack={() => setView('shop')} 
            onBuy={(size, price) => { 
              setSelectedProduct({...selectedProduct, chosenSize: size, chosenPrice: price});
              setView('checkout'); 
            }} 
          />
        )}

        {view === 'checkout' && selectedProduct && (
          <CheckoutView 
            product={selectedProduct} 
            rekening={rekening} 
            onComplete={() => setView('shop')} 
            onBack={() => setView('shop')} 
          />
        )}

        {view === 'login' && <AdminLogin creds={adminCreds} onLoginSuccess={() => { setIsAdminLoggedIn(true); setView('admin'); }} onBack={() => setView('shop')} />}
        
        {view === 'admin' && isAdminLoggedIn && (
          <AdminDashboard products={products} orders={orders} rekening={rekening} adminCreds={adminCreds} appId={appId} onLogout={() => { setIsAdminLoggedIn(false); setView('shop'); }} />
        )}

        {view === 'cart' && <CartView items={cart} onRemove={(idx) => { const c = [...cart]; c.splice(idx,1); setCart(c); }} onCheckout={() => setView('checkout')} />}
      </main>

      <footer className="bg-[#050505] text-white pt-24 pb-12 px-6 mt-40 border-t-2 border-[#D4AF37]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-4xl font-serif font-bold italic tracking-[0.2em] text-[#D4AF37] mb-8 uppercase">DEVI OFFICIAL</h2>
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed mb-10">Mendefinisikan ulang kemewahan busana muslim kontemporer. Estetika dan kemewahan dalam setiap helai material.</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-10 text-zinc-300">Payment Methods</h4>
            <div className="grid grid-cols-3 gap-6 opacity-30 grayscale">
               {Object.values(BANK_LOGOS).map((l, i) => <img key={i} src={l} className="h-6 object-contain" alt="" />)}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-10 text-zinc-300">Hubungi Kami</h4>
            <div className="space-y-6 text-sm text-zinc-500 font-medium tracking-tight">
               <div className="flex items-center gap-4"><Phone size={14} /> +62 812-9988-7766</div>
               <div className="flex items-center gap-4"><Mail size={14} /> boutique@deviofficial.id</div>
            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM (RESTORED) */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-zinc-900 pt-12">
          <p className="text-zinc-600 text-[9px] uppercase tracking-[0.6em] font-bold">© 2024 Devi_Official Luxury Group.</p>
          <button onClick={() => setView('login')} className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold tracking-widest hover:text-[#D4AF37] transition-all border-none bg-transparent cursor-pointer">
             <ShieldAlert size={14} /> SECURE LOGIN
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes progress-line { 0% { left: -100%; } 100% { left: 100%; } }
        .animate-progress-line { width: 50%; position: absolute; animation: progress-line 2s infinite linear; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function ProductGrid({ products, onView }) {
  if (!products || products.length === 0) return (
    <div className="py-40 text-center flex flex-col items-center gap-4 text-black">
      <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      <p className="text-zinc-300 font-bold tracking-widest uppercase text-[10px]">Menyusun Katalog...</p>
    </div>
  );
  
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-black">
        {products.map((p) => (
          <div key={p.id} className="group cursor-pointer bg-white border border-zinc-100 rounded-[2.5rem] p-3 hover:shadow-2xl transition-all duration-500" onClick={() => onView(p)}>
            <div className="relative aspect-[3/4.5] overflow-hidden rounded-[1.5rem] mb-8 bg-zinc-50 shadow-inner">
              <img src={p.imageURL} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt={p.name} />
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-[#D4AF37] px-4 py-2 rounded-full text-[9px] font-bold tracking-widest uppercase">{p.category}</div>
            </div>
            <div className="text-center pb-6 px-4">
              <p className="text-[18px] font-bold text-black mb-1 tracking-tighter font-serif">{formatIDR(p.price)}</p>
              <h3 className="text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase mb-6 line-clamp-1 group-hover:text-black transition-colors">{p.name}</h3>
              <div className="flex justify-center gap-1 opacity-50">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-[#D4AF37] text-[#D4AF37]" />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductDetailView({ product, onBack, onBuy }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [currentPrice, setCurrentPrice] = useState(product.price);

  useEffect(() => {
    if (selectedSize && product.sizePrices && product.sizePrices[selectedSize]) {
      setCurrentPrice(product.sizePrices[selectedSize]);
    } else {
      setCurrentPrice(product.price);
    }
  }, [selectedSize, product]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-black">
      <button onClick={onBack} className="flex items-center gap-3 text-zinc-400 mb-12 text-[10px] font-bold uppercase tracking-[0.4em] hover:text-black transition-all border-none bg-transparent cursor-pointer outline-none"><ChevronLeft size={20} /> Kembali</button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
        <div className="sticky top-32 aspect-[4/5.5] bg-zinc-50 rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-100">
          <img src={product.imageURL} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="flex flex-col">
          <p className="text-[#D4AF37] text-[11px] font-bold uppercase mb-8 tracking-[0.8em] border-l-4 border-[#D4AF37] pl-6">{product.category}</p>
          <h2 className="text-5xl md:text-7xl font-serif font-bold mb-8 uppercase tracking-tighter leading-tight">{product.name}</h2>
          <p className="text-4xl md:text-6xl font-bold text-black mb-16 tracking-tighter font-serif transition-all">{formatIDR(currentPrice)}</p>
          <div className="space-y-16">
            <div>
               <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-8 text-zinc-400 border-b pb-4">Select Your Fit</h4>
               <div className="flex flex-wrap gap-4">
                  {(product.sizes || []).map(s => (
                    <div key={s} className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => setSelectedSize(s)} 
                        className={`min-w-[75px] h-[75px] rounded-2xl flex items-center justify-center font-bold text-[11px] border-2 transition-all cursor-pointer ${selectedSize === s ? 'bg-black text-[#D4AF37] border-black scale-110 shadow-xl' : 'border-zinc-100 text-zinc-400 hover:border-black bg-transparent'}`}
                      >
                        {s}
                      </button>
                      {product.sizePrices?.[s] && (
                        <span className="text-[9px] font-bold text-[#D4AF37]">{formatIDR(product.sizePrices[s])}</span>
                      )}
                    </div>
                  ))}
               </div>
            </div>
            <button onClick={() => { if(!selectedSize) return alert("Pilih ukuran dulu!"); onBuy(selectedSize, currentPrice); }} className="w-full bg-black text-[#D4AF37] py-8 rounded-[2.5rem] text-[12px] font-bold uppercase tracking-[0.6em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-zinc-900 transition-all active:scale-95 border-none cursor-pointer">Lanjutkan Pembayaran</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutView({ product, rekening, onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ 
    invoice: `INV-DEVI-${Math.floor(Date.now() / 1000).toString().slice(-6)}`,
    paymentTime: new Date().toISOString().split('T')[0],
    transferTo: '',
    bankFrom: '',
    senderName: '',
    amount: product.chosenPrice || product.price,
    proofImage: '',
    status: 'pending'
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Gambar terlalu besar! Gunakan screenshot agar tidak lama.");
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `artifacts/${appId}/public/data/proofs/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      setFormData(prev => ({ ...prev, proofImage: url }));
    } catch (err) { alert("Gagal upload bukti: " + err.message); }
    finally { setUploading(false); }
  };

  const downloadReceipt = () => {
    if (!window.jspdf) return alert("Sistem struk sedang dimuat, tunggu sebentar.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DEVI OFFICIAL LUXURY", 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text("Official Payment Receipt", 105, 38, { align: 'center' });
    doc.line(20, 45, 190, 45);
    
    const fields = [
      ["Invoice", formData.invoice],
      ["Tanggal", formData.paymentTime],
      ["Produk", product.name],
      ["Ukuran", product.chosenSize || "Default"],
      ["Total", formatIDR(formData.amount)],
      ["Status", "Menunggu Verifikasi Admin"]
    ];

    let y = 60;
    fields.forEach(f => {
      doc.setFont("helvetica", "bold");
      doc.text(f[0] + ":", 30, y);
      doc.setFont("helvetica", "normal");
      doc.text(f[1], 100, y);
      y += 10;
    });

    doc.setFontSize(8);
    doc.text("Simpan struk ini sebagai bukti transaksi Anda.", 105, 250, { align: 'center' });
    doc.save(`DEVI_OFFICIAL_${formData.invoice}.pdf`);
  };

  const handleSubmit = async () => {
    if (!formData.senderName || !formData.transferTo || !formData.bankFrom) return alert("Lengkapi data formulir!");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { 
        ...formData, 
        createdAt: serverTimestamp(), 
        productName: product.name,
        productSize: product.chosenSize
      });
      setStep(3);
    } catch (e) { alert("Gagal mengirim pesanan: " + e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 text-black">
       <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl border border-zinc-100 relative">
          <button onClick={onBack} className="absolute top-8 right-8 p-3 hover:bg-zinc-50 rounded-full transition-all border-none bg-transparent cursor-pointer outline-none"><X size={24} /></button>
          
          {step === 1 && (
             <div className="animate-in fade-in">
                <h3 className="text-3xl font-serif font-bold italic uppercase mb-12 text-center text-black">Pilih Rekening Tujuan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                   {rekening.map(rek => (
                     <div key={rek.id} onClick={() => { setFormData({...formData, transferTo: `${rek.bankName} - ${rek.accountNumber} (A.N ${rek.accountHolder})`}); setStep(2); }} className="p-8 border-2 border-zinc-50 rounded-[2rem] hover:border-[#D4AF37] hover:bg-zinc-50/50 cursor-pointer transition-all active:scale-95 group flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                           <img src={BANK_LOGOS[rek.bankName] || "https://placehold.co/100x40?text=Bank"} className="h-6 object-contain grayscale group-hover:grayscale-0 transition-all w-24 text-left" alt="" />
                           <p className="text-lg font-mono font-bold tracking-tighter text-black">{rek.accountNumber}</p>
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">A.N {rek.accountHolder}</p>
                        </div>
                        <ArrowRight size={20} className="text-zinc-200 group-hover:text-black" />
                     </div>
                   ))}
                </div>
             </div>
          )}

          {step === 2 && (
             <div className="space-y-10 animate-in slide-in-from-right duration-700">
                <div className="text-center">
                  <h3 className="text-3xl font-serif font-bold mb-2">Konfirmasi Pembayaran</h3>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Silakan isi detail transfer Anda</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase ml-4 text-zinc-400">Nomor Invoice</label>
                        <input className="w-full bg-zinc-50 p-6 rounded-[1.5rem] border-none text-sm font-bold text-black outline-none shadow-inner" value={formData.invoice} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase ml-4 text-zinc-400">Waktu Pembayaran</label>
                        <div className="relative">
                          <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                          <input type="date" className="w-full bg-zinc-50 p-6 pl-16 rounded-[1.5rem] border-none text-sm font-bold text-black outline-none shadow-inner" value={formData.paymentTime} onChange={e => setFormData({...formData, paymentTime: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase ml-4 text-zinc-400">Ditransfer Ke</label>
                        <input className="w-full bg-zinc-100 p-6 rounded-[1.5rem] border-none text-[11px] font-bold text-black outline-none" value={formData.transferTo} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase ml-4 text-zinc-400">Bank Asal</label>
                        <input placeholder="BCA, Mandiri, BRI, dll" className="w-full bg-zinc-50 p-6 rounded-[1.5rem] border-none text-sm font-bold text-black outline-none shadow-inner" value={formData.bankFrom} onChange={e => setFormData({...formData, bankFrom: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase ml-4 text-zinc-400">Nama Pemilik Rekening</label>
                        <input placeholder="Sesuai nama di struk" className="w-full bg-zinc-50 p-6 rounded-[1.5rem] border-none text-sm font-bold text-black outline-none shadow-inner" value={formData.senderName} onChange={e => setFormData({...formData, senderName: e.target.value})} />
                      </div>
                   </div>

                   <div className="flex flex-col gap-6">
                      <label className="text-[10px] font-bold uppercase text-center text-zinc-400">Bukti Transfer (Opsional)</label>
                      <div onClick={() => document.getElementById('uPf').click()} className="flex-1 aspect-square border-2 border-dashed border-zinc-100 rounded-[2.5rem] bg-zinc-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-inner group relative">
                         {formData.proofImage ? (
                           <img src={formData.proofImage} className="w-full h-full object-cover" alt="Proof" />
                         ) : (
                           <div className="text-center p-8">
                             {uploading ? <Loader2 className="animate-spin text-[#D4AF37] mx-auto mb-4" size={48} /> : <Upload className="text-zinc-200 mx-auto mb-4" size={48} />}
                             <p className="text-[11px] font-bold uppercase text-zinc-300 mt-2 tracking-widest leading-relaxed">Klik untuk Unggah Screenshot</p>
                           </div>
                         )}
                         <input type="file" id="uPf" className="hidden" accept="image/*" onChange={handleUpload} />
                      </div>
                      <button onClick={handleSubmit} disabled={uploading} className="w-full bg-black text-[#D4AF37] py-7 rounded-[2rem] font-bold uppercase text-[12px] tracking-[0.5em] shadow-xl hover:bg-zinc-900 transition-all disabled:opacity-50 cursor-pointer border-none mt-4 flex items-center justify-center gap-4">
                         {uploading ? "Sedang Mengirim..." : "Konfirmasi Pembayaran"}
                      </button>
                   </div>
                </div>
             </div>
          )}

          {step === 3 && (
            <div className="text-center py-20 animate-in zoom-in duration-1000">
               <div className="w-32 h-32 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl border-[8px] border-white"><CheckCircle size={64} /></div>
               <h3 className="text-4xl font-serif font-bold uppercase mb-4 text-black">Pesanan Terkirim</h3>
               <p className="text-sm text-zinc-400 mb-12 leading-relaxed max-w-sm mx-auto uppercase tracking-widest font-medium">Boutique Expert kami akan memverifikasi transaksi Anda segera.</p>
               
               <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                 <button onClick={downloadReceipt} className="bg-white border-2 border-zinc-100 text-zinc-900 px-12 py-5 rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-zinc-50 cursor-pointer">
                    <Download size={18} /> Unduh Struk PDF
                 </button>
                 <button onClick={onComplete} className="bg-black text-[#D4AF37] px-16 py-6 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-3xl border-none cursor-pointer">
                    Kembali Belanja
                 </button>
               </div>
            </div>
          )}
       </div>
    </div>
  );
}

function AdminDashboard({ products, orders, rekening, adminCreds, appId, onLogout }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [saving, setSaving] = useState(false);
  const [instaUrl, setInstaUrl] = useState('');
  const [formData, setFormData] = useState({ 
    imageURL: '', 
    name: '', 
    price: '', 
    category: 'Baju', 
    description: '', 
    sizes: [], 
    sizePrices: {} 
  });
  const [rekData, setRekData] = useState({ bankName: 'BCA', accountNumber: '', accountHolder: '' });

  const handleSizeToggle = (s) => {
    setFormData(prev => {
      const newSizes = prev.sizes.includes(s) ? prev.sizes.filter(x => x !== s) : [...prev.sizes, s];
      return { ...prev, sizes: newSizes };
    });
  };

  const handleSizePriceChange = (size, value) => {
    setFormData(prev => ({
      ...prev,
      sizePrices: { ...prev.sizePrices, [size]: Number(value) }
    }));
  };

  const fetchInstaImage = () => {
    if (!instaUrl.includes('instagram.com')) return alert("Link tidak valid!");
    const cleanUrl = instaUrl.split('?')[0];
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/') + "media/?size=l"}&w=800&output=jpg`;
    setFormData({ ...formData, imageURL: proxyUrl });
    alert("Gambar Berhasil Ditarik!");
  };

  const addProduct = async () => {
    if (!formData.name || !formData.price || !formData.imageURL) return alert("Lengkapi data!");
    setSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), { 
        ...formData, 
        price: Number(formData.price), 
        createdAt: serverTimestamp() 
      });
      setFormData({ imageURL: '', name: '', price: '', category: 'Baju', description: '', sizes: [], sizePrices: {} });
      setInstaUrl('');
      alert("Produk Berhasil Ditambahkan!");
    } catch (err) { alert("Gagal! " + err.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row gap-12 text-black">
      <aside className="lg:w-80 space-y-6">
        <div className="bg-zinc-950 p-10 rounded-[3rem] text-white shadow-2xl relative border border-white/5 overflow-hidden">
           <h2 className="text-xl font-serif font-bold italic text-[#D4AF37] uppercase tracking-widest">Master</h2>
        </div>
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-6 space-y-2 shadow-sm text-black">
          {['orders', 'inventory', 'banking'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-8 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border-none cursor-pointer ${activeTab === tab ? 'bg-zinc-950 text-white shadow-lg scale-105' : 'text-zinc-400 hover:bg-zinc-50 bg-transparent'}`}>
              {tab.toUpperCase()}
            </button>
          ))}
          <button onClick={onLogout} className="w-full text-left px-8 py-5 rounded-2xl text-[10px] font-bold uppercase text-red-500 mt-10 hover:bg-red-50 transition-all border-none bg-transparent cursor-pointer">LOGOUT</button>
        </div>
      </aside>

      <div className="flex-1 bg-white border border-zinc-100 rounded-[3.5rem] p-10 md:p-16 shadow-sm min-h-[85vh]">
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
             <div className="space-y-12">
                <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-[#D4AF37] border-b pb-4 text-black font-serif italic">Inventory Management</h3>
                <div className="aspect-[3/4] rounded-[3rem] bg-zinc-50 flex items-center justify-center overflow-hidden relative shadow-inner border border-zinc-100">
                   {formData.imageURL ? <img src={formData.imageURL} className="w-full h-full object-cover" alt="" /> : <Instagram size={64} className="opacity-10 text-black" />}
                </div>
                <div className="space-y-8">
                   <div className="space-y-3 font-bold">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Instagram URL</label>
                      <div className="flex gap-2">
                        <input placeholder="Link Post IG" className="flex-1 bg-zinc-50 p-7 rounded-[2rem] border-none text-xs text-black shadow-inner outline-none" value={instaUrl} onChange={e => setInstaUrl(e.target.value)} />
                        <button onClick={fetchInstaImage} className="px-8 bg-black text-white rounded-2xl text-[10px] font-bold uppercase transition-all hover:bg-[#3a7d44] border-none cursor-pointer">Fetch</button>
                      </div>
                   </div>
                   <input placeholder="Nama Produk" className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-sm font-bold uppercase text-black shadow-inner outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   <div className="grid grid-cols-2 gap-4">
                     <input type="number" placeholder="Base Price (IDR)" className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-black shadow-inner outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                     <select className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-black font-bold outline-none cursor-pointer shadow-inner bg-transparent" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                   
                   <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 ml-4">Harga per Ukuran (Opsional)</p>
                      <div className="space-y-4">
                        {SIZE_OPTIONS.map(s => (
                          <div key={s} className="flex items-center gap-4">
                            <button onClick={() => handleSizeToggle(s)} className={`px-4 py-2 rounded-xl text-[9px] font-bold border-2 transition-all min-w-[70px] ${formData.sizes.includes(s) ? 'bg-black text-[#D4AF37] border-black' : 'border-zinc-100 text-zinc-300 bg-transparent'}`}>{s}</button>
                            {formData.sizes.includes(s) && (
                              <input 
                                type="number" 
                                placeholder={`Harga khusus ${s}`} 
                                className="flex-1 bg-zinc-50 p-3 rounded-xl border-none text-[10px] text-black shadow-inner outline-none" 
                                value={formData.sizePrices[s] || ''} 
                                onChange={e => handleSizePriceChange(s, e.target.value)} 
                              />
                            )}
                          </div>
                        ))}
                      </div>
                   </div>
                   
                   <textarea placeholder="Deskripsi..." className="w-full bg-zinc-50 p-7 rounded-[2rem] h-40 border-none text-black shadow-inner outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                   <button onClick={addProduct} disabled={saving} className="w-full bg-black text-[#D4AF37] py-8 rounded-[2.5rem] font-bold uppercase tracking-[0.4em] text-[11px] shadow-3xl disabled:opacity-50 border-none cursor-pointer">
                      {saving ? "Publishing..." : "Publish Product"}
                   </button>
                </div>
             </div>
             
             <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-4 no-scrollbar border-l border-zinc-50 pl-10 text-black">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-300">Inventory ({products.length})</h3>
                {products.map(p => (
                  <div key={p.id} className="p-8 border border-zinc-100 rounded-[2.5rem] flex items-center justify-between hover:shadow-xl transition-all bg-white shadow-sm text-black">
                     <div className="flex items-center gap-8"><img src={p.imageURL} className="w-16 h-16 rounded-2xl object-cover shadow-lg" alt="" /><div><h4 className="text-sm font-bold uppercase line-clamp-1">{p.name}</h4><p className="text-[10px] font-bold text-[#D4AF37] mt-1 tracking-widest">{formatIDR(p.price)}</p></div></div>
                     <button onClick={async () => { if(window.confirm("Hapus?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id)); }} className="p-4 bg-zinc-50 rounded-2xl text-red-300 hover:text-red-500 shadow-sm border-none cursor-pointer"><Trash2 size={20}/></button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
           <div className="space-y-12 text-black">
             <h3 className="text-4xl font-serif font-bold italic border-b border-zinc-50 pb-8 uppercase text-center">Boutique Orders</h3>
             <div className="grid grid-cols-1 gap-8">
               {orders.map(o => (
                 <div key={o.id} className="border border-zinc-100 p-10 rounded-[3.5rem] flex flex-col xl:flex-row justify-between gap-12 bg-white shadow-sm relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-2 h-full ${o.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                   <div className="flex gap-10">
                     <div className="relative group cursor-zoom-in" onClick={() => window.open(o.proofImage, '_blank')}>
                        <img src={o.proofImage || "https://placehold.co/100x150?text=No+Proof"} className="w-32 h-44 rounded-[2rem] object-cover shadow-2xl border-4 border-white" alt="Proof" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] flex items-center justify-center text-white font-bold text-[10px] tracking-widest uppercase">PREVIEW</div>
                     </div>
                     <div className="space-y-4 text-black">
                       <span className={`px-5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${o.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>{o.status?.toUpperCase()}</span>
                       <h4 className="text-3xl font-bold uppercase text-zinc-900 tracking-tighter">{o.senderName}</h4>
                       <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                          <div><p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Invoice</p><p className="text-xs font-mono font-bold text-zinc-600">{o.invoice}</p></div>
                          <div><p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Produk</p><p className="text-xs font-bold text-black">{o.productName} ({o.productSize})</p></div>
                          <div><p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Bank Asal</p><p className="text-xs font-bold text-[#D4AF37] uppercase">{o.bankFrom}</p></div>
                          <div><p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Total Bayar</p><p className="text-xs font-bold text-[#3a7d44]">{formatIDR(o.amount)}</p></div>
                       </div>
                     </div>
                   </div>
                   <div className="flex xl:flex-col items-center justify-center gap-4">
                      {o.status === 'pending' && <button onClick={async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id), {status: 'confirmed'}); }} className="w-full px-12 py-5 bg-black text-[#D4AF37] rounded-3xl text-[10px] font-bold uppercase shadow-2xl border-none cursor-pointer">Confirm</button>}
                      <button onClick={async () => { if(window.confirm("Hapus?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id)); }} className="p-5 text-zinc-200 hover:text-red-500 border-none bg-transparent cursor-pointer"><Trash2 size={24}/></button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === 'banking' && (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-20 text-black">
              <div className="space-y-12">
                 <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-[#D4AF37] border-b pb-4">Official Bank Access</h3>
                 <div className="space-y-8 text-black">
                    <select className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-black font-bold outline-none cursor-pointer shadow-inner bg-transparent" value={rekData.bankName} onChange={e => setRekData({...rekData, bankName: e.target.value})}>
                       {Object.keys(BANK_LOGOS).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input placeholder="Nomor Rekening" className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-sm font-bold text-black shadow-inner outline-none" value={rekData.accountNumber} onChange={e => setRekData({...rekData, accountNumber: e.target.value})} />
                    <input placeholder="Nama Pemilik" className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-sm font-bold text-black shadow-inner outline-none uppercase" value={rekData.accountHolder} onChange={e => setRekData({...rekData, accountHolder: e.target.value})} />
                    <button onClick={async () => {
                      if(!rekData.accountNumber || !rekData.accountHolder) return alert("Lengkapi data!");
                      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rekening'), rekData);
                      setRekData({ bankName: 'BCA', accountNumber: '', accountHolder: '' });
                      alert("Rekening Aktif!");
                    }} className="w-full bg-black text-[#D4AF37] py-8 rounded-[3rem] font-bold uppercase text-[11px] shadow-3xl border-none cursor-pointer">Tambah Rekening</button>
                 </div>
              </div>
              <div className="space-y-6 border-l border-zinc-50 pl-10 text-black">
                 <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-300">Live Bank Cards ({rekening.length})</h3>
                 {rekening.map(rek => (
                    <div key={rek.id} className="p-10 bg-zinc-50 rounded-[3rem] border border-zinc-100 flex justify-between items-center group shadow-sm text-black">
                       <div className="flex flex-col gap-2">
                          <img src={BANK_LOGOS[rek.bankName]} className="h-6 object-contain w-20 text-left" alt="" />
                          <p className="text-2xl font-mono font-bold text-black">{rek.accountNumber}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic border-none">A.N {rek.accountHolder}</p>
                       </div>
                       <button onClick={async () => { if(window.confirm("Hapus?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rekening', rek.id)); }} className="p-4 bg-white rounded-2xl text-red-200 hover:text-red-500 shadow-sm border-none cursor-pointer"><Trash2 size={18} /></button>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}

function CartView({ items, onRemove, onCheckout }) {
  const total = items.reduce((sum, item) => sum + Number(item.price), 0);
  return (
    <div className="max-w-4xl mx-auto py-32 px-6 text-black">
       <h2 className="text-5xl font-serif font-bold italic tracking-tighter uppercase mb-16 text-center">Your <span className="text-[#D4AF37]">Cart</span></h2>
       {items.length === 0 ? (
         <div className="text-center py-40 border-2 border-dashed border-zinc-100 rounded-[4rem]">
            <ShoppingBag size={64} className="mx-auto text-zinc-100 mb-8" />
            <p className="font-bold uppercase tracking-widest text-zinc-300">Keranjang Kosong</p>
         </div>
       ) : (
          <div className="space-y-8 text-black">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-10 border border-zinc-100 rounded-[3rem] bg-white shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-10">
                  <img src={item.imageURL} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-2xl border-4 border-white transition-transform group-hover:scale-105" alt="" />
                  <div><h4 className="font-bold uppercase text-lg tracking-tight mb-2 text-black">{item.name}</h4><p className="text-sm font-bold text-[#D4AF37] font-serif">{formatIDR(item.price)}</p></div>
                </div>
                <button onClick={() => onRemove(idx)} className="p-5 text-zinc-200 hover:text-red-500 bg-zinc-50 rounded-full transition-all hover:bg-red-50 shadow-inner border-none cursor-pointer outline-none"><Trash2 size={24} /></button>
              </div>
            ))}
            <div className="flex flex-col md:flex-row justify-between items-center pt-16 border-t mt-16 border-zinc-100">
               <div className="text-center md:text-left mb-8 md:mb-0"><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em] mb-2 font-serif italic font-bold">Total Selection</p><p className="text-5xl font-bold tracking-tighter font-serif text-black">{formatIDR(total)}</p></div>
               <button onClick={onCheckout} className="bg-black text-[#D4AF37] px-24 py-8 rounded-full font-bold shadow-3xl hover:scale-105 transition-all uppercase text-[12px] tracking-[0.4em] border-none cursor-pointer">Checkout Now</button>
            </div>
          </div>
       )}
    </div>
  );
}

function AdminLogin({ creds, onLoginSuccess, onBack }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  const handle = (e) => {
    e.preventDefault();
    const inputUser = u.trim().toLowerCase();
    const inputPass = p.trim();
    if (!creds) return alert("Sistem keamanan memuat, tunggu sebentar.");
    const validUser = (creds.username || 'admin').trim().toLowerCase();
    const validPass = (creds.password || 'admin123').trim();
    if (inputUser === validUser && inputPass === validPass) onLoginSuccess();
    else alert("Identitas Tidak Dikenali!");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in zoom-in duration-500 text-black">
      <div className="bg-white w-full max-w-sm rounded-[4rem] p-16 relative shadow-3xl border border-[#D4AF37]/30">
        <button onClick={onBack} className="absolute top-12 right-12 text-zinc-300 hover:text-black transition-all border-none bg-transparent outline-none cursor-pointer"><X size={24} /></button>
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#D4AF37]/10"><Lock size={32} className="text-[#D4AF37]" /></div>
          <h3 className="text-2xl font-serif font-bold uppercase tracking-tight">Security Portal</h3>
        </div>
        <form onSubmit={handle} className="space-y-6">
          <input placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" className="w-full bg-zinc-50 p-8 rounded-[2rem] outline-none font-bold uppercase tracking-widest text-[10px] shadow-inner border-none focus:ring-1 focus:ring-black text-black" />
          <input type="password" placeholder="Pass-Key" value={p} onChange={(e) => setP(e.target.value)} className="w-full bg-zinc-50 p-8 rounded-[2rem] outline-none font-bold shadow-inner border-none focus:ring-1 focus:ring-black text-black" />
          <button type="submit" className="w-full bg-zinc-950 text-[#D4AF37] py-8 rounded-[2.5rem] font-bold uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 border-none cursor-pointer">Authorize Access</button>
        </form>
      </div>
    </div>
  );
}
