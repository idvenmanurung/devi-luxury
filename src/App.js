import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
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
  Edit2, 
  Trash2, 
  X, 
  CheckCircle,
  CreditCard,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  ShieldCheck, 
  Search, 
  Upload, 
  Clock, 
  FileText, 
  Settings, 
  LogOut, 
  Star, 
  Minus, 
  Lock, 
  Key, 
  Layers, 
  Check, 
  Eye, 
  Info,
  Download,
  AlertCircle,
  Mail,
  Zap,
  Smartphone,
  ShieldAlert,
  Award,
  Globe,
  Truck,
  Banknote,
  Verified,
  Languages,
  Loader2,
  Sparkles,
  Wand2,
  Quote,
  Instagram,
  Link as LinkIcon,
  WifiOff,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  LayoutDashboard,
  Wallet,
  Receipt,
  ArrowRight,
  RefreshCw,
  UserCheck
} from 'lucide-react';

// --- CONFIGURATION FIREBASE (FIXED: Hardcoded for Hosting stability) ---
const firebaseConfig = {
  apiKey: "AIzaSyA8ncdjMeCTu7JEbcP-4JCVEX_-cfq8xh8",
  authDomain: "tabungan-a85ae.firebaseapp.com",
  projectId: "tabungan-a85ae",
  storageBucket: "tabungan-a85ae.firebasestorage.app",
  messagingSenderId: "502871375543",
  appId: "1:502871375543:web:5617b49ea6a25782ff5732",
  measurementId: "G-NV2L9GZM6T"
};

// Gunakan ID unik untuk aplikasi Anda
const appId = "devi-official-premium-production-v1";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const storage = getStorage(app);

// --- TRANSLATIONS (DEFINED AT GLOBAL SCOPE) ---
const TRANSLATIONS = {
  ID: {
    shop: "Toko",
    signIn: "Masuk",
    search: "Cari Produk...",
    heroTitle: "Keanggunan Abadi",
    heroSub: "Koleksi Eksklusif 2024",
    heroBtn: "Belanja Sekarang",
    all: "Semua",
    back: "Kembali",
    buyNow: "Beli Sekarang",
    cart: "Keranjang",
    material: "Material",
    specs: "Spesifikasi",
    memberLogin: "Login Member",
    joinLegacy: "Daftar",
    adminCenter: "DASHBOARD ADMIN"
  }
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

// --- GEMINI API INTEGRATION ---
const callGemini = async (prompt, systemInstruction = "") => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  try {
    const payload = {
      contents: [{ parts: [{ text: String(prompt) }] }],
      systemInstruction: { parts: [{ text: String(systemInstruction) }] }
    };
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "AI sedang tidak merespon.";
  } catch (err) { return "Gagal menghubungi AI."; }
};

const formatIDR = (amount) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

// --- MAIN APP ---
export default function App() {
  const [view, setView] = useState('shop'); 
  const [user, setUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminCreds, setAdminCreds] = useState(null); // Mulai dari null agar tahu status memuat
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [rekening, setRekening] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const t = TRANSLATIONS.ID;

  // Inisialisasi Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { 
        console.error("Auth Fail");
      } finally {
        setLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Sinkronisasi Data
  useEffect(() => {
    if (!user) return;

    const pRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const rRef = collection(db, 'artifacts', appId, 'public', 'data', 'rekening');
    const oRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const aRef = collection(db, 'artifacts', appId, 'public', 'data', 'admin_settings');

    const errorFn = (err) => console.warn("Firestore error:", err.message);

    const unsubP = onSnapshot(pRef, (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))), errorFn);
    const unsubR = onSnapshot(rRef, (s) => setRekening(s.docs.map(d => ({ id: d.id, ...d.data() }))), errorFn);
    const unsubO = onSnapshot(oRef, (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))), errorFn);
    
    const unsubA = onSnapshot(aRef, (s) => {
      if (!s.empty) {
        setAdminCreds(s.docs[0].data());
      } else {
        const defaultCreds = { username: 'admin', password: 'admin123' };
        setAdminCreds(defaultCreds);
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admin_settings', 'main'), defaultCreds).catch(() => {});
      }
    }, errorFn);
    
    return () => { unsubP(); unsubR(); unsubO(); unsubA(); };
  }, [user]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => {
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, categoryFilter, searchTerm]);

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="font-serif tracking-[0.6em] animate-pulse text-2xl text-[#D4AF37] italic">DEVI OFFICIAL</div>
      <div className="w-40 h-[1px] bg-[#D4AF37]/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-[#D4AF37] animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#1A1A1A] font-sans selection:bg-[#D4AF37] selection:text-black">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 h-20 md:h-24">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex-1 hidden lg:flex items-center gap-8">
            <button onClick={() => { setView('shop'); setCategoryFilter('All'); }} className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#3a7d44] transition-all">Collections</button>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#D4AF37] transition-colors" size={14} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-zinc-100 border-none rounded-full pl-10 pr-6 py-2.5 text-[10px] w-40 focus:w-64 transition-all outline-none font-medium" />
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl md:text-3xl font-serif tracking-[0.4em] font-bold text-black cursor-pointer uppercase select-none" onClick={() => setView('shop')}>DEVI<span className="text-[#D4AF37]">_OFFICIAL</span></h1>
          </div>
          <div className="flex-1 flex justify-end gap-6 items-center">
             <button onClick={() => setView('cart')} className="relative p-2 hover:bg-zinc-100 rounded-full transition-all">
               <ShoppingBag size={20} />
               {cart.length > 0 && <span className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">{cart.length}</span>}
             </button>
             <div className="flex items-center gap-4">
                <div className="bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-100 flex items-center gap-2">
                   <User size={14} className="text-[#D4AF37]" />
                   <span className="text-[9px] font-bold uppercase text-zinc-500">
                      {user?.email ? user.email.split('@')[0] : (isAdminLoggedIn ? "Admin" : "Guest")}
                   </span>
                </div>
                {isAdminLoggedIn ? (
                  <button onClick={() => setView('admin')} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-[9px] font-bold tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg">
                    <LayoutDashboard size={14} /> DASHBOARD
                  </button>
                ) : (
                  <button onClick={() => setView('login')} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                    <Key size={20} />
                  </button>
                )}
             </div>
          </div>
        </div>
      </header>

      <main className="animate-in fade-in duration-1000">
        {view === 'shop' && (
          <>
            <HeroSection onExplore={() => window.scrollTo({top: 800, behavior: 'smooth'})} />
            <div className="bg-white border-b border-zinc-100 sticky top-20 md:top-24 z-40">
              <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-start md:justify-center gap-8 overflow-x-auto no-scrollbar">
                <button onClick={() => setCategoryFilter('All')} className={`text-[10px] uppercase font-bold tracking-[0.4em] transition-all px-6 py-2 rounded-full whitespace-nowrap ${categoryFilter === 'All' ? 'bg-black text-[#D4AF37]' : 'text-zinc-400 hover:text-black'}`}>Semua</button>
                {CATEGORIES.map(c => <button key={c} onClick={() => setCategoryFilter(c)} className={`text-[10px] uppercase font-bold tracking-[0.4em] transition-all px-6 py-2 rounded-full whitespace-nowrap ${categoryFilter === c ? 'bg-black text-[#D4AF37]' : 'text-zinc-400 hover:text-black'}`}>{c}</button>)}
              </div>
            </div>
            <ProductGrid products={filteredProducts} onView={(p) => { setSelectedProduct(p); setView('detail'); window.scrollTo(0,0); }} />
          </>
        )}
        {view === 'detail' && selectedProduct && <ProductDetailView product={selectedProduct} onBack={() => setView('shop')} onBuy={() => setView('checkout')} onAddCart={() => { setCart([...cart, selectedProduct]); }} t={t} />}
        {view === 'checkout' && <CheckoutView product={selectedProduct} rekening={rekening} onComplete={() => setView('shop')} onBack={() => setView('shop')} />}
        {view === 'cart' && <CartView items={cart} onRemove={(idx) => { const c = [...cart]; c.splice(idx,1); setCart(c); }} onCheckout={() => setView('checkout')} />}
        {view === 'login' && <AdminLogin creds={adminCreds} onLoginSuccess={() => { setIsAdminLoggedIn(true); setView('admin'); }} onBack={() => setView('shop')} />}
        {view === 'admin' && isAdminLoggedIn && <AdminDashboard products={products} orders={orders} rekening={rekening} adminCreds={adminCreds} appId={appId} onLogout={() => { setIsAdminLoggedIn(false); setView('shop'); }} t={t} />}
      </main>

      <footer className="bg-[#050505] text-white pt-24 pb-12 px-6 mt-40 border-t-2 border-[#D4AF37]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24 text-black">
          <div className="col-span-1 md:col-span-2 text-white">
            <h2 className="text-4xl font-serif font-bold italic tracking-[0.2em] text-[#D4AF37] mb-8 uppercase">DEVI OFFICIAL</h2>
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed mb-10">Mendefinisikan ulang kemewahan busana muslim kontemporer. Estetika dan kemewahan dalam setiap helai material.</p>
            <div className="flex gap-6 text-white">
               <Instagram size={20} className="hover:text-[#D4AF37] cursor-pointer" />
               <Facebook size={20} className="hover:text-[#D4AF37] cursor-pointer" />
               <Twitter size={20} className="hover:text-[#D4AF37] cursor-pointer" />
            </div>
          </div>
          <div className="text-white">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-10 text-zinc-300">Payment Methods</h4>
            <div className="grid grid-cols-3 gap-6 opacity-30 grayscale">
               {Object.values(BANK_LOGOS).slice(0, 6).map((l, i) => <img key={i} src={l} className="h-6 object-contain" alt="" />)}
            </div>
          </div>
          <div className="text-white">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-10 text-zinc-300">Hubungi Kami</h4>
            <div className="space-y-6 text-sm text-zinc-500 font-medium tracking-tight">
               <div className="flex items-center gap-4"><Phone size={14} /> +62 812-9988-7766</div>
               <div className="flex items-center gap-4"><Mail size={14} /> boutique@deviofficial.id</div>
               <div className="flex items-start gap-4"><MapPin size={14} className="mt-1" /> HQ: Jakarta Tower, ID</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-zinc-900 pt-12">
          <p className="text-zinc-600 text-[9px] uppercase tracking-[0.6em] font-bold">© 2024 Devi_Official Luxury Group.</p>
          <button onClick={() => setView('login')} className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold tracking-widest hover:text-[#D4AF37] transition-all">
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

function HeroSection({ onExplore }) {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-black">
      <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Hero" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
      <div className="relative z-10 text-center text-white px-6 max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <p className="text-[10px] uppercase tracking-[1.5em] mb-12 font-bold text-[#D4AF37]">The Pinnacle of Modesty</p>
        <h2 className="text-6xl md:text-9xl font-serif mb-12 italic tracking-tighter font-bold uppercase leading-none text-white">Luxury <br/> <span className="text-[#D4AF37]">Collection</span></h2>
        <button onClick={onExplore} className="mt-12 px-16 py-6 bg-[#D4AF37] text-black text-[11px] font-bold uppercase tracking-[0.6em] rounded-full hover:scale-105 transition-all shadow-2xl">Shop Now</button>
      </div>
    </section>
  );
}

function ProductGrid({ products, onView }) {
  if (!products || products.length === 0) return (
    <div className="py-40 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      <p className="text-zinc-300 font-bold tracking-widest uppercase text-sm">Menyusun Katalog...</p>
    </div>
  );
  
  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-black">
        {products.map((p) => (
          <div key={p.id} className="group cursor-pointer bg-white border border-zinc-100 rounded-[2rem] p-3 hover:shadow-2xl transition-all duration-500" onClick={() => onView(p)}>
            <div className="relative aspect-[3/4.5] overflow-hidden rounded-[1.5rem] mb-8 bg-zinc-50 shadow-inner">
              <img src={p.imageURL} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt={p.name} referrerPolicy="no-referrer" />
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-[#D4AF37] px-4 py-2 rounded-full text-[9px] font-bold tracking-widest">{p.category}</div>
            </div>
            <div className="text-center pb-6 px-4">
              <p className="text-[18px] font-bold text-black mb-1 tracking-tighter font-serif">{formatIDR(p.price)}</p>
              <h3 className="text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase mb-6 line-clamp-1 group-hover:text-black transition-colors">{p.name}</h3>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-[#D4AF37] text-[#D4AF37]" />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductDetailView({ product, onBack, onBuy, onAddCart, t }) {
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');

  const getAiStyleAdvice = async () => {
    setLoadingAi(true);
    try {
      const res = await callGemini(`Mix & match mewah untuk ${product.name}.`, "AI Stylist Devi Official");
      setAiAdvice(String(res));
    } catch { setAiAdvice("AI sedang tidak tersedia."); }
    finally { setLoadingAi(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 animate-in slide-in-from-right duration-700">
      <button onClick={onBack} className="flex items-center gap-3 text-zinc-400 mb-12 text-[10px] font-bold uppercase tracking-[0.4em] hover:text-black transition-all"><ChevronLeft size={20} /> {t.back}</button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start text-black">
        <div className="sticky top-32 aspect-[4/5.5] bg-zinc-50 rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-100 group">
          <img src={product.imageURL} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[5s]" alt="" referrerPolicy="no-referrer" />
        </div>
        <div className="flex flex-col">
          <p className="text-[#D4AF37] text-[11px] font-bold uppercase mb-8 tracking-[0.8em] border-l-4 border-[#D4AF37] pl-6">{product.category}</p>
          <h2 className="text-5xl md:text-7xl font-serif font-bold mb-8 uppercase tracking-tighter leading-tight">{product.name}</h2>
          <p className="text-5xl font-bold text-black mb-16 tracking-tighter font-serif">{formatIDR(product.price)}</p>
          <div className="space-y-16">
            <div>
               <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-8 text-zinc-400 border-b pb-4 text-black">Select Your Fit</h4>
               <div className="flex flex-wrap gap-4">
                  {(product.sizes || []).map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`min-w-[70px] h-[70px] rounded-2xl flex items-center justify-center font-bold text-[11px] border-2 transition-all ${selectedSize === s ? 'bg-black text-[#D4AF37] border-black scale-110 shadow-xl' : 'border-zinc-100 text-zinc-400 hover:border-black'}`}>{s}</button>
                  ))}
               </div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 relative group shadow-sm hover:shadow-xl transition-all">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] mb-6 flex items-center gap-4 text-black"><Wand2 size={18} className="text-[#D4AF37]" /> Boutique Expert AI Advice</h4>
              {!aiAdvice && !loadingAi && <button onClick={getAiStyleAdvice} className="bg-black text-[#D4AF37] px-8 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Generate Guidance</button>}
              {loadingAi && <p className="text-[10px] animate-pulse text-zinc-400 font-bold uppercase tracking-widest">Curating Your Style...</p>}
              {aiAdvice && <p className="text-[13px] leading-loose text-zinc-600 italic font-medium whitespace-pre-wrap">{aiAdvice}</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <button onClick={() => { if(!selectedSize) return alert("Pilih ukuran dulu!"); onBuy(); }} className="flex-[2] bg-black text-[#D4AF37] py-8 rounded-[2.5rem] text-[12px] font-bold uppercase tracking-[0.6em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-zinc-900 transition-all active:scale-95">Beli Sekarang</button>
              <button onClick={() => { if(!selectedSize) return alert("Pilih ukuran dulu!"); onAddCart(); alert("Added to cart."); }} className="flex-1 border-2 border-zinc-100 text-zinc-900 py-8 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-50 transition-all">Keranjang</button>
            </div>
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
    invoice: `INV-DEVI-${Math.floor(100000 + Math.random() * 900000)}`,
    buyerName: '', bankFrom: '', senderName: '', amount: product?.price || 0, transferTo: '', proofImage: '', status: 'pending'
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `artifacts/${appId}/public/data/proofs/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      setFormData(prev => ({ ...prev, proofImage: url }));
    } catch { alert("Gagal upload."); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!formData.buyerName || !formData.proofImage) return alert("Lengkapi data dan bukti transfer!");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { ...formData, createdAt: serverTimestamp(), productName: product.name });
      setStep(3);
    } catch (e) { console.error(e); alert("Gagal mengirim."); }
  };

  return (
    <div className="max-w-4xl mx-auto py-24 px-6 animate-in slide-in-from-bottom duration-1000">
       <div className="bg-white rounded-[4rem] p-12 md:p-20 shadow-2xl border border-zinc-100 relative text-black">
          <button onClick={onBack} className="absolute top-12 right-12 p-3 hover:bg-zinc-50 rounded-full transition-all"><X size={24} /></button>
          {step === 1 && (
             <div className="animate-in fade-in">
                <h3 className="text-4xl font-serif font-bold italic tracking-tighter uppercase mb-12 text-center">Payment Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-black">
                   {rekening.map(rek => (
                     <div key={rek.id} onClick={() => { setFormData({...formData, transferTo: `${rek.bankName} - ${rek.accountNumber}`}); setStep(2); }} className="p-8 border-2 border-zinc-50 rounded-[2.5rem] hover:border-[#D4AF37] hover:bg-zinc-50/50 cursor-pointer transition-all active:scale-95 group">
                        <div className="h-8 mb-8 flex justify-between items-center">
                           <img src={BANK_LOGOS[rek.bankName] || "https://placehold.co/100x40?text=Bank"} className="h-full object-contain grayscale group-hover:grayscale-0 transition-all" alt="" />
                           <ArrowRight size={16} className="text-zinc-200 group-hover:text-black" />
                        </div>
                        <p className="text-xl font-mono font-bold tracking-tighter mb-2">{rek.accountNumber}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">A.N {rek.accountHolder}</p>
                     </div>
                   ))}
                </div>
             </div>
          )}
          {step === 2 && (
             <div className="space-y-12 animate-in slide-in-from-right duration-700">
                <div className="bg-zinc-950 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-[#D4AF37]/20">
                   <div className="relative space-y-6 text-center">
                      <p className="text-[10px] font-bold text-[#D4AF37] tracking-[0.4em] uppercase">OFFICIAL INVOICE: {formData.invoice}</p>
                      <h4 className="text-5xl font-bold text-white tracking-tighter font-serif">{formatIDR(formData.amount)}</h4>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-black">
                   <div className="space-y-6">
                      <input placeholder="Nama Lengkap Pembayar" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none shadow-inner text-sm font-bold uppercase border-none" value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} />
                      <input placeholder="Dari Bank Apa?" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none shadow-inner text-sm font-bold uppercase border-none" value={formData.bankFrom} onChange={e => setFormData({...formData, bankFrom: e.target.value})} />
                   </div>
                   <div className="space-y-3">
                      <div onClick={() => document.getElementById('uPf').click()} className="aspect-square border-2 border-dashed border-zinc-100 rounded-[3rem] bg-zinc-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-inner group">
                         {formData.proofImage ? <img src={formData.proofImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" /> : (
                           <>
                             {uploading ? <Loader2 className="animate-spin text-[#D4AF37]" size={32} /> : <Upload className="text-zinc-200" size={32} />}
                             <p className="text-[9px] font-bold uppercase text-zinc-300 mt-4 tracking-widest">Unggah Bukti</p>
                           </>
                         )}
                         <input type="file" id="uPf" className="hidden" accept="image/*" onChange={handleUpload} />
                      </div>
                   </div>
                </div>
                <button onClick={handleSubmit} disabled={uploading || !formData.proofImage} className="w-full bg-black text-[#D4AF37] py-8 rounded-[3rem] font-bold uppercase text-[12px] tracking-[0.5em] shadow-3xl hover:bg-zinc-900 transition-all disabled:opacity-50">Kirim Konfirmasi</button>
             </div>
          )}
          {step === 3 && (
            <div className="text-center py-20 animate-in zoom-in duration-1000">
               <div className="w-32 h-32 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl border-[8px] border-white"><CheckCircle size={64} /></div>
               <h3 className="text-5xl font-serif font-bold italic tracking-tighter uppercase mb-6 text-black">Submitted</h3>
               <p className="text-sm text-zinc-400 mb-16 leading-relaxed max-w-sm mx-auto uppercase tracking-widest font-medium">Boutique Expert kami akan memverifikasi transaksi Anda segera.</p>
               <button onClick={onComplete} className="bg-black text-[#D4AF37] px-20 py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.6em] shadow-3xl">Selesai</button>
            </div>
          )}
       </div>
    </div>
  );
}

function AdminDashboard({ products, orders, rekening, adminCreds, appId, onLogout, t }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [saving, setSaving] = useState(false);
  const [instaUrl, setInstaUrl] = useState('');
  const [formData, setFormData] = useState({ imageURL: '', name: '', price: '', category: 'Baju', description: '', sizes: [] });
  const [rekData, setRekData] = useState({ bankName: 'BCA', accountNumber: '', accountHolder: '' });
  const [newAdmin, setNewAdmin] = useState({ username: adminCreds?.username || 'admin', password: adminCreds?.password || 'admin123' });

  const fetchInstaImage = () => {
    if (!instaUrl.includes('instagram.com')) return alert("Link tidak valid!");
    const cleanUrl = instaUrl.split('?')[0];
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/') + "media/?size=l"}&w=800&output=jpg`;
    setFormData({ ...formData, imageURL: proxyUrl });
    alert("Gambar Instagram Berhasil Ditarik!");
  };

  const addProduct = async () => {
    if (!formData.name || !formData.price || !formData.imageURL) return alert("Lengkapi data!");
    setSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), { ...formData, price: Number(formData.price), createdAt: serverTimestamp() });
      setFormData({ imageURL: '', name: '', price: '', category: 'Baju', description: '', sizes: [] });
      setInstaUrl('');
      alert("Produk Berhasil Ditambahkan!");
    } catch { alert("Gagal!"); } finally { setSaving(false); }
  };

  const updateAdminIdentity = async () => {
    if (!newAdmin.username || !newAdmin.password) return alert("Data tidak boleh kosong!");
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admin_settings', 'main'), newAdmin);
      alert("Identitas Admin Berhasil Diperbarui!");
    } catch { alert("Gagal memperbarui admin."); }
  };

  return (
    <div className="max-w-full mx-auto px-4 md:px-12 py-20 flex flex-col lg:flex-row gap-12 relative animate-in slide-in-from-bottom duration-1000 text-black">
      <aside className="lg:w-80 space-y-6">
        <div className="bg-zinc-950 p-10 rounded-[3rem] text-white shadow-2xl relative border border-white/5 overflow-hidden">
           <h2 className="text-xl font-serif font-bold italic text-[#D4AF37] uppercase tracking-widest">Dashboard</h2>
        </div>
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-6 space-y-2 shadow-sm text-black">
          {['orders', 'inventory', 'banking', 'identity'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-8 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-zinc-950 text-white shadow-lg scale-105' : 'text-zinc-400 hover:bg-zinc-50'}`}>
              {tab === 'identity' ? 'IDENTITAS ADMIN' : tab.toUpperCase()}
            </button>
          ))}
          <button onClick={onLogout} className="w-full text-left px-8 py-5 rounded-2xl text-[10px] font-bold uppercase text-red-500 mt-10 hover:bg-red-50 transition-all">LOGOUT</button>
        </div>
      </aside>

      <div className="flex-1 bg-white border border-zinc-100 rounded-[3.5rem] p-10 md:p-16 shadow-sm min-h-[85vh] text-black">
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
             <div className="space-y-12">
                <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-[#D4AF37] border-b pb-4 text-black font-serif italic">Instagram Image Collector</h3>
                <div className="aspect-[3/4] rounded-[3rem] bg-zinc-50 flex items-center justify-center overflow-hidden relative shadow-inner border border-zinc-100">
                   {formData.imageURL ? <img src={formData.imageURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" /> : <Instagram size={64} className="opacity-10 text-black" />}
                </div>
                <div className="space-y-8">
                   <div className="space-y-3 text-black font-bold">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Instagram Post URL</label>
                      <div className="flex gap-2">
                        <input placeholder="https://www.instagram.com/p/..." className="flex-1 bg-zinc-50 p-7 rounded-[2rem] outline-none shadow-inner border-none text-xs" value={instaUrl} onChange={e => setInstaUrl(e.target.value)} />
                        <button onClick={fetchInstaImage} className="px-8 bg-black text-white rounded-2xl text-[10px] font-bold uppercase transition-all hover:bg-[#3a7d44]">Fetch</button>
                      </div>
                   </div>
                   <input placeholder="Nama Produk Premium" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none shadow-inner text-sm font-bold uppercase tracking-widest border-none text-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   <div className="grid grid-cols-2 gap-4">
                     <input type="number" placeholder="Price (IDR)" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none shadow-inner font-bold border-none text-black" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                     <select className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none font-bold text-[10px] border-none text-black" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 ml-4">Available Sizes</p>
                      <div className="flex flex-wrap gap-2">
                        {SIZE_OPTIONS.map(s => (
                          <button key={s} onClick={() => setFormData({...formData, sizes: formData.sizes.includes(s) ? formData.sizes.filter(x=>x!==s) : [...formData.sizes, s]})} className={`px-4 py-2 rounded-xl text-[9px] font-bold border-2 transition-all ${formData.sizes.includes(s) ? 'bg-black text-[#D4AF37] border-black' : 'border-zinc-100 text-zinc-300'}`}>{s}</button>
                        ))}
                      </div>
                   </div>
                   <textarea placeholder="Materials & Quality Signature..." className="w-full bg-zinc-50 p-7 rounded-[2rem] h-40 outline-none shadow-inner text-sm border-none text-black" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                   <button onClick={addProduct} disabled={saving} className="w-full bg-black text-[#D4AF37] py-8 rounded-[2.5rem] font-bold uppercase tracking-[0.4em] text-[11px] shadow-3xl transition-all disabled:opacity-50">Publish Product</button>
                </div>
             </div>
             <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-4 no-scrollbar border-l border-zinc-50 pl-10 text-black">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-300">Live Inventory ({products.length})</h3>
                {products.map(p => (
                  <div key={p.id} className="p-8 border border-zinc-100 rounded-[2.5rem] flex items-center justify-between hover:shadow-xl transition-all bg-white shadow-sm group">
                     <div className="flex items-center gap-8"><img src={p.imageURL} className="w-16 h-16 rounded-2xl object-cover shadow-lg" alt="" referrerPolicy="no-referrer" /><div><h4 className="text-sm font-bold uppercase line-clamp-1">{p.name}</h4><p className="text-[10px] font-bold text-[#D4AF37] mt-1 tracking-widest">{formatIDR(p.price)}</p></div></div>
                     <button onClick={async () => { if(window.confirm("Hapus?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id)); }} className="p-4 bg-zinc-50 rounded-2xl text-red-300 hover:text-red-500 shadow-sm transition-all border-none"><Trash2 size={20}/></button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
           <div className="space-y-12">
             <h3 className="text-4xl font-serif font-bold italic border-b border-zinc-50 pb-8 uppercase text-center text-black">Boutique Orders</h3>
             <div className="grid grid-cols-1 gap-8">
               {orders.map(o => (
                 <div key={o.id} className="border border-zinc-100 p-10 rounded-[3.5rem] flex flex-col xl:flex-row justify-between gap-12 bg-white shadow-sm relative overflow-hidden text-black">
                   <div className={`absolute top-0 right-0 w-2 h-full ${o.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                   <div className="flex gap-10">
                     <div className="relative group cursor-zoom-in" onClick={() => window.open(o.proofImage, '_blank')}>
                        <img src={o.proofImage} className="w-32 h-44 rounded-[2rem] object-cover shadow-2xl border-4 border-white transition-transform group-hover:scale-105" alt="Proof" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] flex items-center justify-center text-white font-bold text-[10px] tracking-widest">PREVIEW</div>
                     </div>
                     <div className="space-y-4">
                       <span className={`px-5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${o.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>{o.status.toUpperCase()}</span>
                       <h4 className="text-3xl font-bold uppercase text-zinc-900 tracking-tighter">{o.buyerName}</h4>
                       <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                          <div><p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Invoice</p><p className="text-xs font-mono font-bold text-zinc-600">{o.invoice}</p></div>
                          <div><p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Item</p><p className="text-xs font-bold text-black">{o.productName}</p></div>
                          <div><p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Transfer To</p><p className="text-xs font-bold text-[#D4AF37]">{o.transferTo}</p></div>
                          <div><p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Amount</p><p className="text-xs font-bold text-[#3a7d44]">{formatIDR(o.amount)}</p></div>
                       </div>
                     </div>
                   </div>
                   <div className="flex xl:flex-col items-center justify-center gap-4">
                      {o.status === 'pending' && <button onClick={async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id), {status: 'confirmed'}); }} className="w-full px-12 py-5 bg-black text-[#D4AF37] rounded-3xl text-[10px] font-bold uppercase shadow-2xl hover:bg-green-600 hover:text-white transition-all text-black">Confirm</button>}
                      <button onClick={async () => { if(window.confirm("Hapus?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id)); }} className="p-5 text-zinc-200 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === 'banking' && (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
              <div className="space-y-12 text-black">
                 <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-[#D4AF37] border-b pb-4">Official Bank Access</h3>
                 <div className="space-y-8 text-black">
                    <select className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none shadow-inner font-bold text-sm uppercase tracking-widest border-none" value={rekData.bankName} onChange={e => setRekData({...rekData, bankName: e.target.value})}>
                       {Object.keys(BANK_LOGOS).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input placeholder="Account Number" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none shadow-inner text-sm font-bold tracking-widest border-none" value={rekData.accountNumber} onChange={e => setRekData({...rekData, accountNumber: e.target.value})} />
                    <input placeholder="Account Holder Name" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none shadow-inner text-sm font-bold uppercase tracking-widest border-none" value={rekData.accountHolder} onChange={e => setRekData({...rekData, accountHolder: e.target.value})} />
                    <button onClick={async () => {
                      if(!rekData.accountNumber || !rekData.accountHolder) return alert("Lengkapi data!");
                      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rekening'), rekData);
                      setRekData({ bankName: 'BCA', accountNumber: '', accountHolder: '' });
                      alert("Rekening Aktif!");
                    }} className="w-full bg-black text-[#D4AF37] py-8 rounded-[3rem] font-bold uppercase text-[11px] shadow-3xl transition-all border-none">Enable Banking</button>
                 </div>
              </div>
              <div className="space-y-6 border-l border-zinc-50 pl-10 text-black">
                 <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-300">Live Bank Cards ({rekening.length})</h3>
                 {rekening.map(rek => (
                    <div key={rek.id} className="p-10 bg-zinc-50 rounded-[3rem] border border-zinc-100 flex justify-between items-center group shadow-sm">
                       <div className="flex items-center gap-8">
                          <img src={BANK_LOGOS[rek.bankName]} className="h-6 w-16 object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="" />
                          <div><p className="text-2xl font-mono font-bold tracking-tighter">{rek.accountNumber}</p><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic border-none">A.N {rek.accountHolder}</p></div>
                       </div>
                       <button onClick={async () => { if(window.confirm("Hapus?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rekening', rek.id)); }} className="p-4 bg-white rounded-2xl text-red-200 hover:text-red-500 shadow-sm transition-all border-none"><Trash2 size={18} /></button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'identity' && (
           <div className="max-w-2xl mx-auto space-y-12 animate-in zoom-in duration-700">
              <div className="text-center text-black">
                 <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border border-[#D4AF37]/20"><UserCheck size={32} className="text-[#D4AF37]" /></div>
                 <h3 className="text-3xl font-serif font-bold italic tracking-tighter uppercase mb-2">Identitas Admin</h3>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em] mb-12">Security Credentials Management</p>
              </div>
              <div className="bg-zinc-50 p-12 rounded-[4rem] shadow-inner space-y-8 text-black">
                 <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-6">Admin Username</label>
                    <input className="w-full bg-white p-7 rounded-[2rem] outline-none shadow-sm text-sm font-bold uppercase tracking-[0.2em] border-none" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-6">Secure Password</label>
                    <input className="w-full bg-white p-7 rounded-[2rem] outline-none shadow-sm text-sm font-bold tracking-[0.2em] border-none" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} />
                 </div>
                 <button onClick={updateAdminIdentity} className="w-full bg-black text-[#D4AF37] py-8 rounded-[3rem] font-bold uppercase text-[11px] tracking-[0.4em] shadow-3xl hover:bg-zinc-900 transition-all border-none">Update Credentials</button>
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
    <div className="max-w-4xl mx-auto py-32 px-6 animate-in slide-in-from-bottom duration-500">
       <h2 className="text-5xl font-serif font-bold italic tracking-tighter uppercase mb-16 text-center text-black">Your <span className="text-[#D4AF37]">Cart</span></h2>
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
                  <img src={item.imageURL} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-2xl border-4 border-white transition-transform group-hover:scale-105" alt="" referrerPolicy="no-referrer" />
                  <div><h4 className="font-bold uppercase text-lg tracking-tight mb-2 text-black">{item.name}</h4><p className="text-sm font-bold text-[#D4AF37] font-serif">{formatIDR(item.price)}</p></div>
                </div>
                <button onClick={() => onRemove(idx)} className="p-5 text-zinc-200 hover:text-red-500 bg-zinc-50 rounded-full transition-all hover:bg-red-50 shadow-inner border-none"><Trash2 size={24} /></button>
              </div>
            ))}
            <div className="flex flex-col md:flex-row justify-between items-center pt-16 border-t mt-16 border-zinc-100 text-black">
               <div className="text-center md:text-left mb-8 md:mb-0"><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em] mb-2 text-black">Total Selection</p><p className="text-5xl font-bold tracking-tighter font-serif text-black">{formatIDR(total)}</p></div>
               <button onClick={onCheckout} className="bg-black text-[#D4AF37] px-24 py-8 rounded-full font-bold shadow-3xl hover:scale-105 transition-all uppercase text-[12px] tracking-[0.4em] border-none text-black">Checkout Now</button>
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
    if (u === creds.username && p === creds.password) onLoginSuccess();
    else alert("Identitas Tidak Dikenali!");
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in zoom-in duration-500">
      <div className="bg-white w-full max-w-sm rounded-[4rem] p-16 relative shadow-3xl overflow-hidden border border-[#D4AF37]/30 text-black">
        <button onClick={onBack} className="absolute top-12 right-12 text-zinc-300 hover:text-black transition-all border-none bg-transparent"><X size={24} /></button>
        <div className="text-center mb-16 text-black">
          <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#D4AF37]/10"><Lock size={32} className="text-[#D4AF37]" /></div>
          <h3 className="text-2xl font-serif font-bold uppercase tracking-tight text-black">Security Portal</h3>
          <p className="text-[9px] text-zinc-400 mt-2 uppercase font-bold tracking-widest text-black">Admin Access Restricted</p>
        </div>
        <form onSubmit={handle} className="space-y-6">
          <input placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} className="w-full bg-zinc-50 p-8 rounded-[2rem] outline-none font-bold uppercase tracking-widest text-[10px] shadow-inner border-none focus:ring-1 focus:ring-black" />
          <input type="password" placeholder="Pass-Key" value={p} onChange={(e) => setP(e.target.value)} className="w-full bg-zinc-50 p-8 rounded-[2rem] outline-none font-bold shadow-inner border-none focus:ring-1 focus:ring-black" />
          <button type="submit" className="w-full bg-zinc-950 text-[#D4AF37] py-8 rounded-[2.5rem] font-bold uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 border-none text-black">Authorize Access</button>
        </form>
      </div>
    </div>
  );
}
