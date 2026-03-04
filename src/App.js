import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously,
  signInWithCustomToken
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
  setDoc,
  getDoc
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
  Languages
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

// MANDATORY RULE 1: Consistent Pathing
const appId = typeof __app_id !== 'undefined' ? __app_id : 'devi-official-premium-v6';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  ID: {
    shop: "Toko",
    signIn: "Masuk",
    search: "Cari Produk...",
    heroTitle: "Keanggunan Abadi",
    heroSub: "Koleksi Eksklusif 2024",
    heroBtn: "Belanja Sekarang",
    all: "Semua",
    back: "Kembali ke Katalog",
    buyNow: "Beli Sekarang",
    cart: "Keranjang",
    material: "Detail Material",
    specs: "Spesifikasi",
    memberLogin: "Login Anggota",
    joinLegacy: "Daftar Member",
    securityCenter: "Pusat Keamanan Devi_Official",
    needAccount: "Belum punya akun? Daftar di sini",
    haveAccount: "Sudah jadi anggota? Login sekarang",
    securedPayment: "Pembayaran Aman",
    selectRek: "Pilih Satu Rekening Tujuan Devi Official",
    approve: "SETUJUI",
    logout: "KELUAR AKSES",
    adminCenter: "DASHBOARD ADMIN",
    language: "Bahasa",
    footerText: "Toko online kami diawasi oleh hukum perdagangan elektronik Republik Indonesia. Keamanan data pelanggan dan keaslian produk material premium adalah janji kami kepada Anda.",
    orders: "Pesanan",
    catalog: "Katalog",
    bank: "Rekening",
    admins: "Identitas Admin"
  },
  EN: {
    shop: "Shop",
    signIn: "Sign In",
    search: "Search Product...",
    heroTitle: "Timeless Grace",
    heroSub: "Exquisite Collection 2024",
    heroBtn: "Shop The Legacy",
    all: "All",
    back: "Back to Catalog",
    buyNow: "Buy Now",
    cart: "Cart",
    material: "Material Details",
    specs: "Specs",
    memberLogin: "Member Login",
    joinLegacy: "Join Legacy",
    securityCenter: "Devi_Official Security Center",
    needAccount: "Need an account? Sign Up Here",
    haveAccount: "Existing member? Log In Now",
    securedPayment: "Secure Payment",
    selectRek: "Select One Official Account",
    approve: "APPROVE",
    logout: "LOGOUT ACCESS",
    adminCenter: "ADMIN CENTER",
    language: "Language",
    footerText: "Our online store is supervised by the electronic commerce laws of the Republic of Indonesia. Customer data security and authenticity of premium material products are our promise to you.",
    orders: "Orders",
    catalog: "Catalog",
    bank: "Bank",
    admins: "Admins"
  }
};

const PAYMENT_LOGOS = {
  'Bank Central Asia (BCA)': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg',
  'Bank Mandiri': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg',
  'Bank Rakyat Indonesia (BRI)': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_Logo.svg',
  'Bank Negara Indonesia (BNI)': 'https://upload.wikimedia.org/wikipedia/id/f/fa/Bank_Negara_Indonesia_logo.svg',
  'DANA': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dan_automotive.png',
  'OVO': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg',
  'GoPay': 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg'
};

const CATEGORIES = ['Gamis Syari', 'Koko Pria', 'Set Keluarga', 'Abaya', 'Hijab Premium', 'Kaos Oversize', 'Hoodie', 'Kemeja', 'Blouse', 'Dress Pesta', 'Tas Trendy'];

const SIZE_OPTIONS = {
  'Gamis Syari': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Koko Pria': ['S', 'M', 'L', 'XL', 'XXL'],
  'Set Keluarga': ['Couple', 'Family Set'],
  'Abaya': ['S', 'M', 'L', 'XL'],
  'Hijab Premium': ['All Size'],
  'Kaos Oversize': ['L', 'XL', 'XXL'],
  'Hoodie': ['M', 'L', 'XL'],
  'Kemeja': ['S', 'M', 'L', 'XL'],
  'Blouse': ['XS', 'S', 'M', 'L'],
  'Dress Pesta': ['S', 'M', 'L', 'XL'],
  'Tas Trendy': ['Standar']
};

const formatIDR = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      };
    };
  });
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState('shop'); 
  const [lang, setLang] = useState('ID'); 
  const [user, setUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [rekening, setRekening] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } catch { await signInAnonymously(auth); }
        } else { await signInAnonymously(auth); }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const paths = {
      p: collection(db, 'artifacts', appId, 'public', 'data', 'products'),
      r: collection(db, 'artifacts', appId, 'public', 'data', 'rekening'),
      o: collection(db, 'artifacts', appId, 'public', 'data', 'orders'),
      a: collection(db, 'artifacts', appId, 'public', 'data', 'admins')
    };
    const unsubP = onSnapshot(paths.p, (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubR = onSnapshot(paths.r, (s) => setRekening(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubO = onSnapshot(paths.o, (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubA = onSnapshot(paths.a, (s) => setAdminUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubP(); unsubR(); unsubO(); unsubA(); };
  }, [user]);

  const filteredProducts = useMemo(() => 
    products.filter(p => (categoryFilter === 'All' || p.category === categoryFilter) && p.name.toLowerCase().includes(searchTerm.toLowerCase())), [products, categoryFilter, searchTerm]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center font-serif text-[#D4AF37] tracking-[0.5em] animate-pulse italic uppercase">DEVI OFFICIAL</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-[#3a7d44] selection:text-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-100 px-6 h-20 md:h-24">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex-1 hidden lg:flex items-center gap-6">
            <button onClick={() => { setView('shop'); setCategoryFilter('All'); }} className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#3a7d44] transition-colors">{t.shop}</button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
              <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-zinc-50 border-none rounded-full pl-10 pr-4 py-2 text-[10px] w-40 focus:w-60 transition-all outline-none font-bold" />
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl md:text-3xl font-serif tracking-[0.4em] font-bold text-black cursor-pointer uppercase" onClick={() => setView('shop')}>DEVI<span className="text-[#D4AF37]">_OFFICIAL.ID</span></h1>
          </div>
          <div className="flex-1 flex justify-end gap-5 items-center">
             <button onClick={() => setLang(lang === 'ID' ? 'EN' : 'ID')} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-100 text-[10px] font-bold hover:bg-zinc-100 transition-all">
               <Languages size={14} className="text-[#D4AF37]" /> {lang}
             </button>
             <button onClick={() => setView('cart')} className="relative hover:text-[#3a7d44] transition-colors">
               <ShoppingBag size={22} />
               <span className="absolute -top-2 -right-2 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>
             </button>
             {user && !user.isAnonymous ? (
                <div className="flex items-center gap-3 bg-zinc-50 px-4 py-1.5 rounded-full border border-zinc-100">
                  <span className="text-[9px] font-bold uppercase text-[#3a7d44] truncate max-w-[100px]">{user.email.split('@')[0]}</span>
                  <button onClick={() => { signOut(auth); setView('shop'); }} className="text-zinc-400 hover:text-red-500 transition-colors"><LogOut size={16} /></button>
                </div>
             ) : (
                <button onClick={() => setView('login')} className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-zinc-950 text-white hover:bg-[#3a7d44] transition-all text-[10px] font-bold uppercase tracking-widest shadow-xl">
                  <User size={16} /> {t.signIn}
                </button>
             )}
          </div>
        </div>
      </header>

      <main>
        {view === 'shop' && (
          <div className="animate-in fade-in duration-700">
            <HeroSection t={t} />
            <FilterBar active={categoryFilter} onChange={setCategoryFilter} t={t} />
            <ProductGrid products={filteredProducts} onView={(p) => { setSelectedProduct(p); setView('detail'); window.scrollTo(0,0); }} t={t} />
          </div>
        )}
        {view === 'detail' && selectedProduct && <ProductDetailView product={selectedProduct} onBack={() => setView('shop')} onBuy={() => setShowPaymentModal(true)} onAddCart={() => setCart([...cart, selectedProduct])} t={t} />}
        {view === 'login' && <AuthView type="login" onSwitch={() => setView('register')} onBack={() => setView('shop')} t={t} />}
        {view === 'register' && <AuthView type="register" onSwitch={() => setView('login')} onBack={() => setView('shop')} t={t} />}
        {view === 'cart' && <CartView items={cart} onRemove={(idx) => { const newCart = [...cart]; newCart.splice(idx,1); setCart(newCart); }} onCheckout={() => setView('shop')} t={t} />}
        {view === 'admin' && isAdminLoggedIn && <AdminDashboard products={products} rekening={rekening} orders={orders} adminUsers={adminUsers} appId={appId} onLogout={() => { setIsAdminLoggedIn(false); setView('shop'); }} t={t} />}
      </main>

      {showAdminLoginModal && <AdminLoginModal adminUsers={adminUsers} onSuccess={() => { setIsAdminLoggedIn(true); setView('admin'); setShowAdminLoginModal(false); }} onClose={() => setShowAdminLoginModal(false)} t={t} />}
      
      {showPaymentModal && selectedProduct && <PaymentConfirmationModal product={selectedProduct} rekening={rekening} appId={appId} onClose={() => setShowPaymentModal(false)} t={t} />}

      <footer className="bg-[#0A0A0A] text-white pt-32 pb-12 px-6 mt-40 border-t-4 border-[#D4AF37]">
        <div className="max-w-7xl mx-auto mb-24 text-center">
           <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-3 rounded-full mb-12 animate-pulse">
              <ShieldCheck className="text-[#D4AF37]" size={20} />
              <span className="text-[11px] font-bold uppercase tracking-[0.4em]">100% Verified Luxury Store</span>
           </div>
           <h2 className="text-xl font-bold uppercase tracking-[0.5em] text-white/50 mb-12">Official Partners & Logistics</h2>
           <div className="flex flex-wrap justify-center items-center gap-16 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-1000">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" className="h-6" alt="BCA" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" className="h-6" alt="Mandiri" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-6" alt="Paypal" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8" alt="Mastercard" />
           </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20 border-t border-white/5 pt-20 mb-24">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-serif tracking-[0.6em] mb-10 italic font-bold uppercase">DEVI OFFICIAL</h2>
            <p className="text-zinc-400 text-sm max-w-md leading-relaxed uppercase tracking-widest font-light">{t.footerText}</p>
          </div>
          <div>
            <h4 className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.4em] mb-10 italic border-b border-[#D4AF37]/20 pb-3 w-fit">Pelayanan Kami</h4>
            <ul className="space-y-6 text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
              <li className="flex items-center gap-4 hover:text-white transition-colors"><Truck size={16} className="text-[#D4AF37]"/> Worldwide Shipping</li>
              <li className="flex items-center gap-4 hover:text-white transition-colors"><Globe size={16} className="text-[#D4AF37]"/> Authentic Selection</li>
              <li className="flex items-center gap-4 hover:text-white transition-colors"><Clock size={16} className="text-[#D4AF37]"/> Support 24H</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.4em] mb-10 italic border-b border-[#D4AF37]/20 pb-3 w-fit">Security</h4>
            <p className="text-[10px] text-zinc-500 leading-loose uppercase tracking-[0.2em] font-medium">Sistem kami menggunakan enkripsi SSL 256-bit. Pembayaran diverifikasi manual untuk menjamin keaslian Boutique Selection Anda.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 pt-12">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.5em] font-bold">© 2024 Devi_Official.id Luxury Group</p>
          <button onClick={() => isAdminLoggedIn ? setView('admin') : setShowAdminLoginModal(true)} className="flex items-center gap-3 text-zinc-500 text-[10px] uppercase tracking-[0.4em] hover:text-[#D4AF37] transition-all group">
            <ShieldAlert size={18} className="group-hover:rotate-12 transition-transform" /> {t.adminCenter}
          </button>
        </div>
      </footer>
    </div>
  );
}

function HeroSection({ t }) {
  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-black">
      <img src="https://images.unsplash.com/photo-1445205170230-053b830c6050?auto=format&fit=crop&q=80&w=2000" className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105" alt="" />
      <div className="relative z-10 text-center text-white px-6">
        <p className="text-[10px] uppercase tracking-[1.2em] mb-10 font-bold text-[#D4AF37]">{t.heroSub}</p>
        <h2 className="text-6xl md:text-9xl font-serif mb-16 italic tracking-tighter font-bold">{t.heroTitle}</h2>
        <button className="px-16 py-5 bg-white text-black text-[11px] font-bold uppercase tracking-[0.6em] rounded-full hover:bg-[#D4AF37] transition-all">{t.heroBtn}</button>
      </div>
    </section>
  );
}

function FilterBar({ active, onChange, t }) {
  return (
    <div className="bg-white border-b border-zinc-100 sticky top-20 md:top-24 z-40">
      <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-start md:justify-center gap-10 overflow-x-auto no-scrollbar">
        <button onClick={() => onChange('All')} className={`text-[10px] uppercase font-bold tracking-[0.4em] transition-all whitespace-nowrap px-4 py-2 rounded-full ${active === 'All' ? 'bg-[#3a7d44] text-white shadow-lg' : 'text-zinc-400 hover:text-black'}`}>{t.all}</button>
        {CATEGORIES.map(c => <button key={c} onClick={() => onChange(c)} className={`text-[10px] uppercase font-bold tracking-[0.4em] transition-all whitespace-nowrap px-4 py-2 rounded-full ${active === c ? 'bg-[#3a7d44] text-white shadow-lg' : 'text-zinc-400 hover:text-black'}`}>{c}</button>)}
      </div>
    </div>
  );
}

function ProductGrid({ products, onView, t }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
        {products.map((p) => (
          <div key={p.id} className="group cursor-pointer bg-white border border-zinc-100 rounded-3xl p-4 hover:shadow-[0_30px_100px_rgba(0,0,0,0.08)] transition-all duration-700" onClick={() => onView(p)}>
            <div className="relative aspect-[3/4.5] overflow-hidden rounded-[1.5rem] mb-10 bg-zinc-50 shadow-inner">
              <img src={p.imageUrl} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt={p.name} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                 <button className="bg-white text-black px-12 py-4 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-2xl">Details</button>
              </div>
            </div>
            <div className="text-center px-4 pb-4">
              <p className="text-[16px] font-bold text-zinc-900 mb-2 tracking-widest font-serif">{formatIDR(p.price)}</p>
              <h3 className="text-[12px] font-medium tracking-[0.2em] text-zinc-400 uppercase mb-6 line-clamp-1 group-hover:text-[#3a7d44] transition-colors">{p.name}</h3>
              <div className="flex justify-center gap-1 mb-8">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-[#D4AF37] text-[#D4AF37]" />)}
              </div>
              <button className="w-full bg-[#3a7d44]/5 text-[#3a7d44] border border-[#3a7d44]/20 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm group-hover:bg-[#3a7d44] group-hover:text-white transition-all">Details</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductDetailView({ product, onBack, onBuy, onAddCart, t }) {
  const [size, setSize] = useState(product.sizes?.[0] || '');
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in slide-in-from-right duration-700">
      <button onClick={onBack} className="flex items-center gap-4 text-zinc-400 mb-16 text-[10px] font-bold uppercase tracking-[0.5em] hover:text-black transition-all"><ChevronLeft size={24} /> {t.back}</button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
        <div className="aspect-[4/5] bg-zinc-50 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-zinc-100"><img src={product.imageUrl} className="w-full h-full object-cover hover:scale-110 transition-transform duration-[3s]" alt="" /></div>
        <div className="flex flex-col">
          <p className="text-[#D4AF37] text-[11px] font-bold uppercase mb-8 tracking-[0.6em] border-l-4 border-[#D4AF37] pl-6 uppercase">{product.category}</p>
          <h2 className="text-5xl md:text-6xl font-serif font-bold mb-8 italic tracking-tighter uppercase">{product.name}</h2>
          <p className="text-5xl font-bold text-[#3a7d44] mb-16 tracking-tighter">{formatIDR(product.price)}</p>
          <div className="space-y-16">
            <div>
               <p className="text-[11px] font-bold uppercase text-zinc-400 mb-8 tracking-widest border-b border-zinc-50 pb-4 uppercase">Available Sizes</p>
               <div className="flex flex-wrap gap-4">{product.sizes?.map(s => <button key={s} onClick={() => setSize(s)} className={`px-14 py-4 rounded-2xl text-[10px] font-bold border-2 transition-all ${size === s ? 'bg-[#3a7d44] text-white border-[#3a7d44] shadow-xl scale-105' : 'border-zinc-100 text-zinc-400 hover:border-zinc-800 hover:text-black'}`}>{s}</button>)}</div>
            </div>
            <div className="flex gap-6">
              <button onClick={onBuy} className="flex-[2] bg-zinc-950 text-white py-8 rounded-[2.5rem] text-[12px] font-bold uppercase tracking-[0.6em] shadow-2xl hover:bg-[#3a7d44] transition-all">{t.buyNow}</button>
              <button onClick={() => { onAddCart(); alert("Added to Collection!"); }} className="flex-1 border-2 border-zinc-100 text-zinc-900 py-8 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-50 transition-all">{t.cart}</button>
            </div>
            <div className="pt-20 border-t border-zinc-100 space-y-12 text-[13px] text-zinc-500 leading-loose uppercase tracking-[0.2em] font-medium">
              <div><h4 className="font-bold text-black mb-6 tracking-[0.4em] flex items-center gap-4 border-b border-zinc-50 pb-3 uppercase"><Layers size={20} className="text-[#D4AF37]"/> {t.material} :</h4><p className="pl-9 whitespace-pre-wrap">{product.material || 'Premium Boutique Selection.'}</p></div>
              <div><h4 className="font-bold text-black mb-6 tracking-[0.4em] flex items-center gap-4 border-b border-zinc-50 pb-3 uppercase"><Info size={20} className="text-[#D4AF37]"/> {t.specs} :</h4><p className="pl-9 whitespace-pre-wrap">{product.desc || 'Exclusive Design Identity.'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthView({ type, onSwitch, onBack, t }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="max-w-md mx-auto py-32 px-6 animate-in zoom-in duration-700 relative">
      <button onClick={onBack} className="absolute top-20 left-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-all">
        <ChevronLeft size={16}/> {t.back}
      </button>
      <div className="text-center mb-16">
        <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-zinc-100 shadow-inner"><User size={40} className="text-[#D4AF37]" /></div>
        <h2 className="text-4xl font-serif font-bold italic mb-4 uppercase tracking-tighter">{type === 'login' ? t.memberLogin : t.joinLegacy}</h2>
        <p className="text-[10px] text-zinc-400 uppercase tracking-[0.5em] font-bold uppercase">{t.securityCenter}</p>
      </div>
      <form onSubmit={async (e) => {
        e.preventDefault(); setLoading(true);
        const em = e.target.email.value; const pw = e.target.password.value;
        try {
          if (type === 'login') { await signInWithEmailAndPassword(auth, em, pw); onBack(); }
          else { await createUserWithEmailAndPassword(auth, em, pw); alert("Registration Success!"); onSwitch(); }
        } catch (err) { alert(err.message); } finally { setLoading(false); }
      }} className="space-y-8">
        <div className="relative"><Mail className="absolute left-7 top-6 text-zinc-300" size={20} /><input name="email" type="email" placeholder="example@gmail.com" className="w-full bg-zinc-50 border-none pl-20 pr-8 py-6 rounded-3xl outline-none text-sm font-bold shadow-inner" required /></div>
        <div className="relative"><Key className="absolute left-7 top-6 text-zinc-300" size={20} /><input name="password" type="password" placeholder="Password" className="w-full bg-zinc-50 border-none pl-20 pr-8 py-6 rounded-3xl outline-none text-sm font-bold shadow-inner" required /></div>
        <button type="submit" className="w-full bg-zinc-950 text-white py-6 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.6em] hover:bg-[#3a7d44] transition-all shadow-2xl">{loading ? '...' : type.toUpperCase()}</button>
      </form>
      <div className="mt-16 text-center">
        <button onClick={onSwitch} className="text-zinc-400 text-[10px] uppercase font-bold tracking-[0.5em] hover:text-[#D4AF37] transition-all border-b border-transparent hover:border-[#D4AF37] pb-3 duration-500 uppercase">
          {type === 'login' ? t.needAccount : t.haveAccount}
        </button>
      </div>
    </div>
  );
}

function CartView({ items, onRemove, onCheckout, t }) {
  const total = items.reduce((sum, item) => sum + Number(item.price), 0);
  return (
    <div className="max-w-4xl mx-auto py-24 px-6 animate-in slide-in-from-bottom duration-500">
       <h2 className="text-4xl font-serif font-bold mb-10 italic uppercase border-b pb-6">Collection Cart</h2>
       {items.length === 0 ? <div className="text-center py-20 text-zinc-300 uppercase font-bold tracking-widest">Empty Cart</div> : (
          <div className="space-y-8">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-10 border border-zinc-100 rounded-[3rem] bg-white shadow-sm hover:shadow-xl transition-all">
                <div className="flex items-center gap-10">
                  <img src={item.imageUrl} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-2xl border-4 border-white" />
                  <div><h4 className="text-lg font-bold uppercase text-zinc-900">{item.name}</h4><p className="text-sm text-[#3a7d44] font-bold mt-2 font-mono">{formatIDR(item.price)}</p></div>
                </div>
                <button onClick={() => onRemove(idx)} className="p-5 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={24} /></button>
              </div>
            ))}
            <div className="pt-16 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-10">
               <div><p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.5em] mb-2 uppercase">Subtotal</p><p className="text-4xl font-bold text-black tracking-tighter">{formatIDR(total)}</p></div>
               <button onClick={onCheckout} className="px-20 py-6 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-[0.6em] hover:bg-[#3a7d44] transition-all shadow-3xl">{t.buyNow}</button>
            </div>
          </div>
       )}
    </div>
  );
}

// --- ADMIN DASHBOARD (ULTRA WIDE) ---
function AdminDashboard({ products, rekening, orders, adminUsers, appId, onLogout, t }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [isEditing, setIsEditing] = useState(null);
  const [showOrderProof, setShowOrderProof] = useState(null);

  const deleteItem = async (coll, id) => {
    if (confirm("Hapus data ini secara PERMANEN?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', coll, id));
  };

  return (
    <div className="w-full max-w-full mx-auto px-4 md:px-12 py-20 flex flex-col lg:flex-row gap-12 animate-in slide-in-from-bottom duration-1000">
      <aside className="lg:w-80 space-y-6 flex-shrink-0">
        <div className="bg-zinc-950 p-14 rounded-[3.5rem] text-white shadow-2xl relative border border-white/5 overflow-hidden">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>
           <h2 className="text-2xl font-serif font-bold italic text-[#D4AF37] tracking-widest relative z-10 uppercase">{t.adminCenter}</h2>
        </div>
        <div className="bg-white border border-zinc-100 rounded-[3.5rem] p-6 space-y-3 shadow-sm">
          {['orders', 'catalog', 'bank', 'admins'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-12 py-5 rounded-3xl text-[11px] font-bold uppercase tracking-[0.3em] transition-all ${activeTab === tab ? 'bg-zinc-950 text-white shadow-2xl scale-105' : 'text-zinc-400 hover:bg-zinc-50'}`}>
              {t[tab] || tab.toUpperCase()}
            </button>
          ))}
          <button onClick={onLogout} className="w-full text-left px-12 py-5 rounded-3xl text-[11px] font-bold uppercase tracking-[0.3em] text-red-500 hover:bg-red-50 mt-16 transition-colors border border-red-50 uppercase font-bold">{t.logout}</button>
        </div>
      </aside>

      <div className="flex-1 bg-white border border-zinc-100 rounded-[4rem] p-10 md:p-16 shadow-sm min-h-[85vh]">
        {activeTab === 'orders' && (
          <div className="space-y-12">
            <h3 className="text-4xl font-serif font-bold italic border-b border-zinc-50 pb-8 uppercase">Order Archive</h3>
            <div className="grid grid-cols-1 gap-8">
              {orders.map(o => (
                <div key={o.id} className="border border-zinc-100 p-10 rounded-[3.5rem] flex flex-col xl:flex-row justify-between gap-12 hover:shadow-xl transition-all bg-zinc-50/20 group">
                  <div className="flex gap-10">
                    <div className="w-32 h-44 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white cursor-zoom-in" onClick={() => setShowOrderProof(o.proofUrl)}>
                      <img src={o.proofUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                    </div>
                    <div className="space-y-3">
                      <span className={`px-4 py-1 rounded-full text-[7px] font-bold uppercase tracking-widest ${o.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>{o.status}</span>
                      <h4 className="text-2xl font-bold uppercase text-zinc-900">{o.buyerName}</h4>
                      <p className="text-[10px] text-zinc-400 pt-6 font-mono leading-relaxed uppercase pt-4">
                         INV: {o.invoice} <br/> BANK: {o.targetRek?.bankName} <br/> ITEM: {o.productName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between py-2">
                    <p className="text-3xl font-bold font-serif text-[#3a7d44]">{formatIDR(o.amount || 0)}</p>
                    <div className="flex gap-4">
                      {o.status === 'pending' && <button onClick={async () => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id), {status: 'confirmed'})} className="px-14 py-5 bg-zinc-950 text-white rounded-[1.5rem] text-[10px] font-bold uppercase shadow-xl hover:bg-[#3a7d44] transition-all">{t.approve}</button>}
                      <button onClick={() => deleteItem('orders', o.id)} className="p-5 text-zinc-300 hover:text-red-500 bg-white rounded-3xl border border-zinc-100 shadow-sm transition-all"><Trash2 size={24} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
             <form onSubmit={async (e) => {
               e.preventDefault();
               const data = {
                 imageUrl: e.target.img.value, name: e.target.name.value, price: Number(e.target.price.value),
                 category: e.target.cat.value, material: e.target.mat.value, desc: e.target.desc.value,
                 sizes: e.target.sizes.value.split(',').map(s => s.trim())
               };
               if (isEditing) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', isEditing), data); setIsEditing(null); }
               else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), data); }
               e.target.reset();
             }} className="space-y-10">
                <h3 className="text-[12px] font-bold uppercase text-[#D4AF37] border-b pb-4">EDITOR KATALOG</h3>
                <input name="img" placeholder="Image URL (HD)" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none text-xs font-mono shadow-inner" defaultValue={isEditing ? products.find(p => p.id === isEditing)?.imageUrl : ''} required />
                <input name="name" placeholder="Product Name" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none text-sm font-bold uppercase tracking-widest shadow-inner" defaultValue={isEditing ? products.find(p => p.id === isEditing)?.name : ''} required />
                <div className="grid grid-cols-2 gap-8">
                   <input name="price" type="number" placeholder="Price (IDR)" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none font-bold text-sm shadow-inner" defaultValue={isEditing ? products.find(p => p.id === isEditing)?.price : ''} required />
                   <select name="cat" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none font-bold text-xs uppercase shadow-inner" defaultValue={isEditing ? products.find(p => p.id === isEditing)?.category : 'Gamis Syari'}>
                     {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <input name="sizes" placeholder="Sizes (e.g. S, M, L, XL)" className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none text-sm font-bold shadow-inner" defaultValue={isEditing ? products.find(p => p.id === isEditing)?.sizes?.join(', ') : ''} required />
                <textarea name="mat" placeholder="Material details..." className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none h-24 text-sm font-medium shadow-inner" defaultValue={isEditing ? products.find(p => p.id === isEditing)?.material : ''}></textarea>
                <textarea name="desc" placeholder="Product description..." className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none h-40 text-sm font-medium shadow-inner" defaultValue={isEditing ? products.find(p => p.id === isEditing)?.desc : ''}></textarea>
                <button type="submit" className="w-full bg-zinc-950 text-white py-7 rounded-[3rem] text-[12px] font-bold uppercase tracking-widest shadow-3xl hover:bg-[#3a7d44] transition-all uppercase">{isEditing ? 'UPDATE PRODUCT' : 'PUBLISH PRODUCT'}</button>
             </form>
             <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-4 no-scrollbar xl:border-l xl:border-zinc-50 xl:pl-16">
                {products.map(p => (
                  <div key={p.id} className="p-8 border border-zinc-100 rounded-[3rem] flex items-center justify-between bg-white shadow-sm hover:shadow-xl transition-all">
                     <div className="flex items-center gap-10"><img src={p.imageUrl} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-xl border border-zinc-50" /><div><h4 className="text-sm font-bold uppercase">{p.name}</h4><p className="text-[11px] font-serif text-[#D4AF37] mt-2 font-bold">{formatIDR(p.price)}</p></div></div>
                     <div className="flex gap-3"><button onClick={() => { setIsEditing(p.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-5 text-zinc-300 hover:text-black bg-zinc-50 rounded-[1.5rem] transition-all"><Edit2 size={24} /></button><button onClick={() => deleteItem('products', p.id)} className="p-5 text-zinc-300 hover:text-red-500 bg-zinc-50 rounded-[1.5rem] transition-all"><Trash2 size={24} /></button></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
             <form onSubmit={async (e) => {
               e.preventDefault();
               await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rekening'), {
                 bankName: e.target.bank.value, accountNumber: e.target.acc.value, accountHolder: e.target.name.value
               }); e.target.reset();
             }} className="space-y-12 bg-zinc-50/50 p-16 rounded-[4rem] shadow-inner">
                <h3 className="text-[11px] font-bold uppercase text-zinc-400 tracking-widest border-b pb-4">ADD PAYMENT ACCOUNT</h3>
                <select name="bank" className="w-full bg-white p-7 rounded-[2rem] outline-none font-bold text-[12px] shadow-sm uppercase tracking-widest">
                  {Object.keys(PAYMENT_LOGOS).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <input name="acc" placeholder="Account Number" className="w-full bg-white p-7 rounded-[2rem] outline-none text-sm font-bold shadow-sm tracking-[0.2em]" required />
                <input name="name" placeholder="Account Holder Name" className="w-full bg-white p-7 rounded-[2rem] outline-none text-sm font-bold uppercase shadow-sm tracking-widest" required />
                <button type="submit" className="w-full bg-zinc-950 text-white py-7 rounded-[3rem] text-[12px] font-bold uppercase tracking-widest shadow-3xl uppercase font-bold">ACTIVATE ACCOUNT</button>
             </form>
             <div className="space-y-6">
                {rekening.map(rek => (
                  <div key={rek.id} className="p-10 border border-zinc-100 rounded-[3.5rem] flex justify-between items-center bg-white shadow-sm hover:shadow-2xl transition-all duration-700 group">
                     <div className="flex items-center gap-12"><div className="w-24 grayscale group-hover:grayscale-0 transition-all duration-1000"><img src={PAYMENT_LOGOS[rek.bankName]} className="max-h-full" /></div><div><p className="text-2xl font-mono font-bold tracking-tighter">{rek.accountNumber}</p><p className="text-[10px] uppercase font-bold text-zinc-400 mt-2 uppercase tracking-widest font-bold">A.N {rek.accountHolder}</p></div></div>
                     <button onClick={() => deleteItem('rekening', rek.id)} className="p-5 text-zinc-200 hover:text-red-500 rounded-2xl border-2 border-zinc-50 shadow-sm transition-all"><Trash2 size={24} /></button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
             <div className="space-y-12 bg-zinc-950 p-16 rounded-[4.5rem] text-white shadow-3xl border border-white/5 relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[100px]"></div>
               <h3 className="text-3xl font-serif font-bold italic text-[#D4AF37] uppercase tracking-widest relative z-10 uppercase">Admin Control</h3>
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'admins'), {
                   username: e.target.user.value.trim().toLowerCase(), password: e.target.pass.value.trim()
                 }); e.target.reset(); alert("Admin Authorized!");
               }} className="space-y-10 relative z-10">
                 <input name="user" placeholder="Username" className="w-full bg-white/5 border border-white/10 p-7 rounded-[2.5rem] outline-none text-sm font-bold uppercase tracking-widest uppercase shadow-inner" required />
                 <input name="pass" type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 p-7 rounded-[2.5rem] outline-none text-sm font-bold tracking-widest shadow-inner" required />
                 <button type="submit" className="w-full bg-[#D4AF37] text-black py-7 rounded-[3rem] text-[12px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-xl uppercase font-bold">GRANT ACCESS</button>
               </form>
             </div>
             <div className="space-y-6">
                {adminUsers.map(adm => (
                  <div key={adm.id} className="p-12 border border-zinc-100 rounded-[3.5rem] flex justify-between items-center bg-white shadow-sm hover:shadow-xl transition-all duration-700">
                     <div className="flex items-center gap-10"><div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center text-[#D4AF37] border border-zinc-100 shadow-inner"><User size={40} /></div><div><p className="text-2xl font-bold uppercase tracking-tighter text-zinc-900">{adm.username}</p><p className="text-[11px] text-zinc-300 font-mono mt-2 uppercase tracking-widest font-bold">SECURED IDENTITY</p></div></div>
                     <button onClick={() => deleteItem('admins', adm.id)} className="p-6 text-zinc-200 hover:text-red-500 rounded-3xl border-2 border-zinc-50 shadow-sm transition-all"><Trash2 size={24} /></button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {showOrderProof && (
        <div className="fixed inset-0 z-[400] bg-black/98 flex items-center justify-center p-12 animate-in fade-in" onClick={() => setShowOrderProof(null)}>
           <img src={showOrderProof} className="max-w-full max-h-full object-contain rounded-[4rem] shadow-[0_0_150px_rgba(212,175,55,0.4)] border-4 border-white/5" />
           <button className="absolute top-12 right-12 text-white bg-white/10 p-7 rounded-full hover:bg-red-500 transition-all shadow-3xl"><X size={48} /></button>
        </div>
      )}
    </div>
  );
}

function PaymentConfirmationModal({ product, rekening, appId, t, onClose }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ buyerName: '', invoice: `DEV-INV-${Math.floor(100000 + Math.random() * 900000)}`, time: new Date().toLocaleString(), targetRek: null, proofUrl: '', amount: product.price });

  const handleProof = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file); 
      const storageRef = ref(storage, `artifacts/${appId}/public/data/proofs/${Date.now()}_proof`);
      await uploadBytes(storageRef, compressed);
      const url = await getDownloadURL(storageRef);
      setFormData({...formData, proofUrl: url});
    } catch { alert("Gagal mengunggah gambar."); } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!formData.proofUrl) return alert("Mohon unggah bukti pembayaran!");
    if (!formData.buyerName) return alert("Mohon masukkan nama pembeli!");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { 
        ...formData, productName: product.name, status: 'pending', createdAt: serverTimestamp() 
      });
      setStep(3);
    } catch { alert("System Error."); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in fade-in overflow-y-auto no-scrollbar">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] p-10 md:p-16 relative shadow-[0_0_150px_rgba(0,0,0,0.5)] my-auto border border-zinc-100 overflow-hidden">
        <button onClick={onClose} className="absolute top-10 right-10 text-zinc-300 hover:text-black transition-all p-2"><X size={32} /></button>
        {step === 1 && (
          <div className="animate-in zoom-in duration-500 text-center">
            <h3 className="text-4xl font-serif font-bold mb-6 text-[#3a7d44] italic uppercase tracking-tighter uppercase">{t.securedPayment}</h3>
            <p className="text-[11px] uppercase tracking-[0.5em] text-zinc-400 mb-14 border-b border-zinc-50 pb-8 font-bold uppercase">{t.selectRek}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {rekening.map(rek => (
                <div key={rek.id} onClick={() => { setFormData({...formData, targetRek: rek}); setStep(2); }} className="p-10 border-2 border-zinc-50 rounded-[3rem] hover:border-[#3a7d44] hover:bg-[#3a7d44]/5 cursor-pointer transition-all flex flex-col items-center bg-zinc-50/10 shadow-sm active:scale-95 duration-500">
                  <div className="h-10 mb-10 grayscale group-hover:grayscale-0 transition-all"><img src={PAYMENT_LOGOS[rek.bankName]} className="max-h-full" alt="" /></div>
                  <p className="text-2xl font-mono font-bold text-zinc-900 tracking-widest">{rek.accountNumber}</p>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 mt-4 tracking-widest font-bold uppercase font-mono">a.n {rek.accountHolder.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-500">
            <h3 className="text-3xl font-serif font-bold italic uppercase border-b border-zinc-50 pb-8 tracking-tighter uppercase">Transaction Point</h3>
            <div className="bg-zinc-950 p-12 rounded-[3rem] text-white shadow-2xl border border-[#D4AF37]/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 scale-[2.5] rotate-12"><Banknote size={150} /></div>
               <div className="space-y-8 relative">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-[#D4AF37] tracking-[0.6em] uppercase">OFFICIAL INVOICE</span><span className="text-sm font-mono font-bold tracking-widest">{formData.invoice}</span></div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-8"><span className="text-[10px] font-bold text-[#D4AF37] tracking-[0.6em] uppercase">GRAND TOTAL</span><span className="text-4xl font-bold text-white tracking-tighter">{formatIDR(formData.amount)}</span></div>
               </div>
            </div>
            <div className="space-y-8">
              <input type="text" placeholder="Masukkan Nama Lengkap Pembeli" value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} className="w-full bg-zinc-50 p-7 rounded-[2rem] outline-none text-sm font-bold uppercase tracking-widest shadow-inner border-none focus:ring-1 focus:ring-black" required />
              <div onClick={() => !uploading && document.getElementById('uPf').click()} className="border-2 border-dashed border-zinc-200 h-80 flex flex-col items-center justify-center rounded-[3rem] cursor-pointer hover:bg-zinc-50 relative overflow-hidden group shadow-inner transition-all duration-500">
                {formData.proofUrl ? <img src={formData.proofUrl} className="w-full h-full object-cover" /> : (
                  <div className="text-center px-6">
                    <Zap className={`mx-auto mb-6 ${uploading ? 'animate-bounce text-[#D4AF37]' : 'text-zinc-200'}`} size={64} />
                    <p className="text-[13px] uppercase font-bold text-zinc-400 tracking-[0.5em]">{uploading ? 'MEMPROSES HD...' : 'UPLOAD BUKTI TRANSFER (HD)'}</p>
                  </div>
                )}
                <input type="file" id="uPf" className="hidden" accept="image/*" onChange={handleProof} />
              </div>
            </div>
            <button onClick={submit} disabled={!formData.proofUrl || uploading} className="w-full bg-[#3a7d44] text-white py-8 rounded-[3.5rem] text-[13px] font-bold uppercase tracking-widest shadow-3xl hover:bg-black active:scale-95 transition-all duration-500 uppercase font-bold">Kirim Konfirmasi Sekarang</button>
          </div>
        )}
        {step === 3 && (
          <div className="text-center py-24 animate-in zoom-in duration-700">
            <CheckCircle size={120} className="mx-auto text-green-500 mb-16 shadow-2xl rounded-full" />
            <h3 className="text-5xl font-serif font-bold italic mb-8 uppercase tracking-tight">Payment Secured</h3>
            <p className="text-zinc-400 text-[12px] uppercase font-bold tracking-widest mb-16 leading-relaxed">Pihak Devi Official akan segera memverifikasi transaksi Anda. Terima kasih.</p>
            <button onClick={onClose} className="bg-black text-white px-32 py-6 rounded-full text-[12px] font-bold uppercase tracking-widest shadow-3xl hover:bg-[#D4AF37] transition-all duration-700 font-bold">Selesai</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- ADMIN LOGIN MODAL (HP FIXED) ---
function AdminLoginModal({ adminUsers, onSuccess, onClose, t }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  
  const handle = (e) => { 
    e.preventDefault(); 
    // FIX Login HP: Normalisasi input agar tidak sensitif spasi/kapital otomatis HP
    const userLower = u.trim().toLowerCase();
    const passTrim = p.trim();

    // Cek Master Passwords (admin123 & 123456)
    const isMaster = (userLower === 'admin' && (passTrim === 'admin123' || passTrim === '123456'));
    
    // Cek Admin dari Database
    const isDynamic = adminUsers.some(a => a.username.trim().toLowerCase() === userLower && a.password.trim() === passTrim);
    
    if(isMaster || isDynamic) onSuccess(); 
    else alert('Identitas tidak dikenali! Periksa huruf besar/kecil (admin123 / 123456)'); 
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in zoom-in">
      <div className="bg-white w-full max-w-md rounded-[4.5rem] p-12 md:p-20 relative shadow-3xl overflow-y-auto max-h-[90vh] border border-zinc-100">
        <button onClick={onClose} className="absolute top-10 right-10 text-zinc-300 hover:text-black transition-all p-2"><X size={36} /></button>
        <div className="text-center mb-16">
           <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-zinc-100 shadow-xl"><Lock size={40} className="text-[#D4AF37]" /></div>
           <h3 className="text-3xl md:text-4xl font-serif font-bold italic tracking-tighter uppercase text-zinc-900 leading-none">Security Gate</h3>
        </div>
        <form onSubmit={handle} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 ml-4">Authorized Identity</label>
            <input 
              type="text" 
              placeholder="Username" 
              value={u} 
              onChange={e => setU(e.target.value)} 
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              className="w-full bg-zinc-50 border-none px-10 py-6 rounded-[2.5rem] outline-none text-xs font-bold uppercase tracking-widest shadow-inner focus:ring-1 focus:ring-black" 
              required 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 ml-4">Encrypted Key</label>
            <input 
              type="password" 
              placeholder="Password" 
              value={p} 
              onChange={e => setP(e.target.value)} 
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-zinc-50 border-none px-10 py-6 rounded-[2.5rem] outline-none text-xs font-bold shadow-inner focus:ring-1 focus:ring-black" 
              required 
            />
          </div>
          <button type="submit" className="w-full bg-zinc-950 text-white py-6 mt-6 rounded-[3rem] text-[11px] font-bold uppercase tracking-[0.6em] hover:bg-[#3a7d44] shadow-3xl active:scale-95 transition-all font-bold">AUTHORIZE ACCESS</button>
        </form>
      </div>
    </div>
  );
}
