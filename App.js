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
    adminCenter: "PUSAT ADMIN",
    language: "Bahasa",
    footerText: "Toko online kami diawasi oleh hukum perdagangan elektronik Republik Indonesia. Keamanan data pelanggan dan keaslian produk material premium adalah janji kami kepada Anda."
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
    footerText: "Our online store is supervised by the electronic commerce laws of the Republic of Indonesia. Customer data security and authenticity of premium material products are our promise to you."
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
  const [lang, setLang] = useState('ID'); // State Bahasa
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

  // Auth First Logic
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Snapshot Listeners
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
    products.filter(p => 
      (categoryFilter === 'All' || p.category === categoryFilter) && 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, categoryFilter, searchTerm]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center font-serif text-[#D4AF37] tracking-[0.5em] animate-pulse italic">DEVI OFFICIAL</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-[#3a7d44] selection:text-white">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 h-20 md:h-24">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex-1 hidden lg:flex items-center gap-6">
            <button onClick={() => { setView('shop'); setCategoryFilter('All'); }} className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#3a7d44] transition-colors">{t.shop}</button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
              <input 
                type="text" 
                placeholder={t.search} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="bg-zinc-50 border-none rounded-full pl-10 pr-4 py-2 text-[10px] w-40 focus:w-60 transition-all outline-none font-bold" 
              />
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl md:text-3xl font-serif tracking-[0.4em] font-bold text-black cursor-pointer uppercase" onClick={() => setView('shop')}>
              DEVI<span className="text-[#D4AF37]">_OFFICIAL.ID</span>
            </h1>
          </div>
          <div className="flex-1 flex justify-end gap-6 items-center">
             {/* Language Toggle */}
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
        {view === 'detail' && selectedProduct && (
          <ProductDetailView 
            product={selectedProduct} 
            t={t}
            onBack={() => setView('shop')} 
            onBuy={() => setShowPaymentModal(true)} 
            onAddCart={() => { setCart([...cart, selectedProduct]); }} 
          />
        )}
        {view === 'login' && <AuthView type="login" t={t} onSwitch={() => setView('register')} onBack={() => setView('shop')} />}
        {view === 'register' && <AuthView type="register" t={t} onSwitch={() => setView('login')} onBack={() => setView('shop')} />}
        {view === 'cart' && <CartView items={cart} t={t} onRemove={(idx) => { const newCart = [...cart]; newCart.splice(idx,1); setCart(newCart); }} onCheckout={() => setView('shop')} />}
        {view === 'admin' && isAdminLoggedIn && <AdminDashboard products={products} rekening={rekening} orders={orders} adminUsers={adminUsers} appId={appId} t={t} onLogout={() => { setIsAdminLoggedIn(false); setView('shop'); }} />}
      </main>

      {showAdminLoginModal && <AdminLoginModal adminUsers={adminUsers} onSuccess={() => { setIsAdminLoggedIn(true); setView('admin'); setShowAdminLoginModal(false); }} onClose={() => setShowAdminLoginModal(false)} />}
      
      {showPaymentModal && selectedProduct && (
        <PaymentConfirmationModal product={selectedProduct} rekening={rekening} appId={appId} t={t} onClose={() => setShowPaymentModal(false)} />
      )}

      {/* Trust-Building Footer */}
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
            <h2 className="text-3xl font-serif tracking-[0.6em] mb-10 italic font-bold">DEVI OFFICIAL</h2>
            <p className="text-zinc-400 text-sm max-w-md leading-relaxed uppercase tracking-widest font-light">{t.footerText}</p>
          </div>
          <div>
            <h4 className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.4em] mb-10 italic border-b border-[#D4AF37]/20 pb-3 w-fit">Pelayanan Kami</h4>
            <ul className="space-y-6 text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
              <li className="flex items-center gap-4 hover:text-white transition-colors"><Truck size={16} className="text-[#D4AF37]"/> Worldwide Shipping</li>
              <li className="flex items-center gap-4 hover:text-white transition-colors"><Globe size={16} className="text-[#D4AF37]"/> Authentic Products</li>
              <li className="flex items-center gap-4 hover:text-white transition-colors"><Clock size={16} className="text-[#D4AF37]"/> 24/7 CS Support</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.4em] mb-10 italic border-b border-[#D4AF37]/20 pb-3 w-fit">Security</h4>
            <p className="text-[10px] text-zinc-500 leading-loose uppercase tracking-[0.2em] font-medium">SSL 256-bit encrypted system. Manual verification for every transaction to ensure maximum safety.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 pt-12">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.5em] font-bold">© 2024 Devi_Official.id Luxury Group</p>
          <button onClick={() => isAdminLoggedIn ? setView('admin') : setShowAdminLoginModal(true)} className="flex items-center gap-3 text-zinc-500 text-[10px] uppercase tracking-[0.4em] hover:text-[#D4AF37] transition-all group">
            <ShieldAlert size={18} className="group-hover:rotate-12 transition-transform" /> Admin Portal
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
                 <button className="bg-white text-black px-12 py-4 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-2xl">View Details</button>
              </div>
            </div>
            <div className="text-center px-4 pb-4">
              <p className="text-[16px] font-bold text-zinc-900 mb-2 tracking-widest font-serif">{formatIDR(p.price)}</p>
              <h3 className="text-[12px] font-medium tracking-[0.2em] text-zinc-400 uppercase mb-6 line-clamp-1 group-hover:text-[#3a7d44] transition-colors">{p.name}</h3>
              <div className="flex justify-center gap-1 mb-8">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-[#D4AF37] text-[#D4AF37]" />)}
              </div>
              <button className="w-full bg-[#3a7d44]/5 text-[#3a7d44] border border-[#3a7d44]/20 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm group-hover:bg-[#3a7d44] group-hover:text-white transition-all">Show Details</button>
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
          <p className="text-[#D4AF37] text-[11px] font-bold uppercase mb-8 tracking-[0.6em] border-l-4 border-[#D4AF37] pl-6">{product.category}</p>
          <h2 className="text-5xl md:text-6xl font-serif font-bold mb-8 italic tracking-tighter uppercase">{product.name}</h2>
          <p className="text-5xl font-bold text-[#3a7d44] mb-16 tracking-tighter">{formatIDR(product.price)}</p>
          <div className="space-y-16">
            <div>
               <p className="text-[11px] font-bold uppercase text-zinc-400 mb-8 tracking-widest border-b border-zinc-50 pb-4">Available Size</p>
               <div className="flex flex-wrap gap-4">{product.sizes?.map(s => <button key={s} onClick={() => setSize(s)} className={`px-14 py-4 rounded-2xl text-[10px] font-bold border-2 transition-all ${size === s ? 'bg-[#3a7d44] text-white border-[#3a7d44] shadow-xl scale-105' : 'border-zinc-100 text-zinc-400 hover:border-zinc-800 hover:text-black'}`}>{s}</button>)}</div>
            </div>
            <div className="flex gap-6">
              <button onClick={onBuy} className="flex-[2] bg-zinc-950 text-white py-8 rounded-[2.5rem] text-[12px] font-bold uppercase tracking-[0.6em] shadow-2xl hover:bg-[#3a7d44] transition-all">{t.buyNow}</button>
              <button onClick={() => { onAddCart(); alert("Added to cart"); }} className="flex-1 border-2 border-zinc-100 text-zinc-900 py-8 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-50 transition-all">{t.cart}</button>
            </div>
            <div className="pt-20 border-t border-zinc-100 space-y-12 text-[13px] text-zinc-500 leading-loose uppercase tracking-[0.2em] font-medium">
              <div><h4 className="font-bold text-black mb-6 tracking-[0.4em] flex items-center gap-4 border-b border-zinc-50 pb-3"><Layers size={20} className="text-[#D4AF37]"/> {t.material} :</h4><p className="pl-9 whitespace-pre-wrap">{product.material || 'Premium fabric selection.'}</p></div>
              <div><h4 className="font-bold text-black mb-6 tracking-[0.4em] flex items-center gap-4 border-b border-zinc-50 pb-3"><Info size={20} className="text-[#D4AF37]"/> {t.specs} :</h4><p className="pl-9 whitespace-pre-wrap">{product.desc || 'Exclusive boutique design.'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthView({ type, onSwitch, onBack, t }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (type === 'register') {
        if (password !== confirmPassword) throw new Error("Passwords mismatch");
        const ucr = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', ucr.user.uid), { email, createdAt: serverTimestamp() });
        alert("Registration success!");
        onSwitch();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onBack();
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-6 animate-in zoom-in duration-700">
      <button onClick={onBack} className="absolute top-32 left-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-all">
        <ChevronLeft size={20}/> Back
      </button>

      <div className="text-center mb-16">
        <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-zinc-100 shadow-inner"><User size={40} className="text-[#D4AF37]" /></div>
        <h2 className="text-4xl font-serif font-bold italic mb-4 uppercase tracking-tighter">{type === 'login' ? t.memberLogin : t.joinLegacy}</h2>
        <p className="text-[10px] text-zinc-400 uppercase tracking-[0.5em] font-bold">{t.securityCenter}</p>
      </div>

      {error && <div className="mb-10 p-6 bg-red-50 text-red-600 rounded-[2rem] text-[11px] font-bold uppercase text-center border border-red-100 flex items-center justify-center gap-3 animate-bounce shadow-sm"><ShieldAlert size={20}/> {error}</div>}
      
      <form onSubmit={handleAuth} className="space-y-8">
        <div className="relative"><Mail className="absolute left-7 top-6 text-zinc-300" size={20} /><input type="email" placeholder="example@gmail.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50 border-none pl-20 pr-8 py-6 rounded-3xl outline-none focus:ring-1 focus:ring-black text-sm font-bold shadow-inner" required /></div>
        <div className="relative"><Key className="absolute left-7 top-6 text-zinc-300" size={20} /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-50 border-none pl-20 pr-8 py-6 rounded-3xl outline-none focus:ring-1 focus:ring-black text-sm font-bold shadow-inner" required /></div>
        {type === 'register' && (
           <div className="relative animate-in slide-in-from-top duration-500"><Lock className="absolute left-7 top-6 text-zinc-300" size={20} /><input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-zinc-50 border-none pl-20 pr-8 py-6 rounded-3xl outline-none focus:ring-1 focus:ring-black text-sm font-bold shadow-inner" required /></div>
        )}
        <button type="submit" disabled={loading} className="w-full bg-zinc-950 text-white py-6 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.6em] hover:bg-[#3a7d44] transition-all shadow-2xl scale-105 active:scale-95">{loading ? 'Processing...' : type.toUpperCase()}</button>
      </form>
      <div className="mt-16 text-center">
        <button onClick={onSwitch} className="text-zinc-400 text-[10px] uppercase font-bold tracking-[0.5em] hover:text-[#D4AF37] transition-all border-b border-transparent hover:border-[#D4AF37] pb-3 duration-500">
          {type === 'login' ? t.needAccount : t.haveAccount}
        </button>
      </div>
    </div>
  );
}

function PaymentConfirmationModal({ product, rekening, appId, t, onClose }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ buyerName: '', invoice: `DEV-INV-${Math.floor(100000 + Math.random() * 900000)}`, time: new Date().toLocaleString(), targetRek: null, bankFrom: '', senderName: '', proofUrl: '', amount: product.price });

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
    } catch { alert("Upload failed."); } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!formData.proofUrl) return alert("Upload proof!");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { 
        ...formData, productName: product.name, status: 'pending', createdAt: serverTimestamp() 
      });
      setStep(3);
    } catch { alert("Error."); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in fade-in overflow-y-auto no-scrollbar">
      <div className="bg-white w-full max-w-3xl rounded-[4.5rem] p-12 relative shadow-[0_0_150px_rgba(212,175,55,0.2)] my-auto overflow-hidden border border-zinc-100">
        <button onClick={onClose} className="absolute top-12 right-12 text-zinc-300 hover:text-black transition-colors"><X size={36} /></button>
        {step === 1 && (
          <div className="animate-in zoom-in duration-500">
            <h3 className="text-4xl font-serif font-bold mb-6 text-[#3a7d44] italic uppercase tracking-tighter">{t.securedPayment}</h3>
            <p className="text-[11px] uppercase tracking-[0.5em] text-zinc-400 mb-14 border-b border-zinc-50 pb-8 font-bold text-center">{t.selectRek}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {rekening.map(rek => (
                <div key={rek.id} onClick={() => { setFormData({...formData, targetRek: rek}); setStep(2); }} className="p-10 border-2 border-zinc-50 rounded-[3rem] hover:border-[#3a7d44] hover:bg-[#3a7d44]/5 cursor-pointer transition-all flex flex-col items-center bg-zinc-50/20 shadow-sm group duration-500">
                  <div className="h-10 mb-10 flex items-center justify-center w-full grayscale group-hover:grayscale-0 transition-all duration-700 scale-125"><img src={PAYMENT_LOGOS[rek.bankName]} className="max-h-full" alt="" /></div>
                  <p className="text-2xl font-mono font-bold text-zinc-900 tracking-widest">{rek.accountNumber}</p>
                  <p className="text-[11px] uppercase font-bold text-zinc-400 mt-4 tracking-[0.2em]">a.n {rek.accountHolder.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-700">
            <h3 className="text-3xl font-serif font-bold italic uppercase border-b border-zinc-50 pb-8 tracking-tighter">Confirmation Point</h3>
            <div className="bg-zinc-950 p-14 rounded-[4rem] text-white shadow-2xl relative border border-[#D4AF37]/20">
               <div className="space-y-8 relative">
                  <div className="flex justify-between border-b border-white/10 pb-8 items-center"><span className="text-[12px] font-bold text-[#D4AF37] tracking-[0.6em]">OFFICIAL INVOICE</span><span className="text-sm font-mono font-bold tracking-[0.3em]">{formData.invoice}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[12px] font-bold text-[#D4AF37] tracking-[0.6em]">GRAND TOTAL</span><span className="text-4xl font-bold text-white tracking-tighter">{formatIDR(formData.amount)}</span></div>
               </div>
            </div>
            <div className="space-y-8">
              <input type="text" placeholder="Buyer Full Name" value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} className="w-full bg-zinc-50 border-none p-7 rounded-[2rem] outline-none text-sm font-bold shadow-inner focus:ring-2 focus:ring-black" />
              <div onClick={() => !uploading && document.getElementById('uPf').click()} className="border-2 border-dashed border-zinc-200 h-80 flex flex-col items-center justify-center rounded-[4rem] cursor-pointer hover:bg-zinc-50 transition-all overflow-hidden relative shadow-inner group">
                {formData.proofUrl ? <img src={formData.proofUrl} className="w-full h-full object-cover" /> : (
                  <div className="text-center">
                    <Zap className={`mx-auto mb-6 ${uploading ? 'animate-bounce text-[#D4AF37]' : 'text-zinc-200'}`} size={64} />
                    <p className="text-[13px] uppercase font-bold text-zinc-400 tracking-[0.5em]">{uploading ? 'PROCESSING HD...' : 'UPLOAD PROOF (HD)'}</p>
                  </div>
                )}
                <input type="file" id="uPf" className="hidden" accept="image/*" onChange={handleProof} />
              </div>
            </div>
            <button onClick={submit} disabled={!formData.proofUrl || uploading} className="w-full bg-[#3a7d44] text-white py-8 rounded-[3rem] text-[13px] font-bold uppercase tracking-[0.8em] shadow-3xl hover:bg-black transition-all">Confirm Now</button>
          </div>
        )}
        {step === 3 && (
          <div className="text-center py-24 animate-in zoom-in duration-700">
            <CheckCircle size={120} className="mx-auto text-green-500 mb-16 shadow-2xl rounded-full" />
            <h3 className="text-5xl font-serif font-bold italic mb-8">Payment Secured</h3>
            <button onClick={onClose} className="bg-black text-white px-32 py-6 rounded-full text-[12px] font-bold uppercase tracking-[0.6em] shadow-3xl hover:bg-[#D4AF37] transition-all">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CartView({ items, onRemove, onCheckout, t }) {
  const total = items.reduce((sum, item) => sum + Number(item.price), 0);
  return (
    <div className="max-w-4xl mx-auto py-24 px-6 animate-in slide-in-from-bottom duration-500">
       <h2 className="text-4xl font-serif font-bold mb-10 italic uppercase border-b pb-6">My Collection Cart</h2>
       {items.length === 0 ? (
          <div className="text-center py-32 border-4 border-dashed border-zinc-50 rounded-[4rem] bg-zinc-50/10">
             <ShoppingBag size={80} className="mx-auto text-zinc-100 mb-8" />
             <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-[0.4em]">Empty Cart</p>
          </div>
       ) : (
          <div className="space-y-8">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-10 border border-zinc-100 rounded-[3rem] bg-white shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-10">
                  <img src={item.imageUrl} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-2xl border-4 border-white" />
                  <div>
                    <h4 className="text-lg font-bold uppercase tracking-tight text-zinc-900">{item.name}</h4>
                    <p className="text-sm text-[#3a7d44] font-bold mt-2 tracking-widest">{formatIDR(item.price)}</p>
                  </div>
                </div>
                <button onClick={() => onRemove(idx)} className="p-5 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={24} /></button>
              </div>
            ))}
            <div className="pt-16 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-10">
               <div><p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.5em] mb-2">Checkout Total</p><p className="text-4xl font-bold text-black tracking-tighter">{formatIDR(total)}</p></div>
               <button onClick={onCheckout} className="px-20 py-6 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-[0.6em] hover:bg-[#3a7d44] transition-all shadow-3xl">{t.buyNow}</button>
            </div>
          </div>
       )}
    </div>
  );
}

// --- ADMIN DASHBOARD ---
function AdminDashboard({ products, rekening, orders, adminUsers, appId, onLogout, t }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Gamis Syari', sizes: [], imageUrl: '', desc: '', stock: 0, material: '' });
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [rekData, setRekData] = useState({ bankName: 'Bank Central Asia (BCA)', accountNumber: '', accountHolder: '' });
  const [isEditing, setIsEditing] = useState(null);
  const [showOrderProof, setShowOrderProof] = useState(null);

  const resetForm = () => {
    setFormData({ name: '', price: '', category: 'Gamis Syari', sizes: [], imageUrl: '', desc: '', stock: 0, material: '' });
    setRekData({ bankName: 'Bank Central Asia (BCA)', accountNumber: '', accountHolder: '' });
    setNewAdmin({ username: '', password: '' });
    setIsEditing(null);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    try {
      if (isEditing) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', isEditing), { ...formData, price: Number(formData.price), stock: Number(formData.stock) });
      else await addDoc(colRef, { ...formData, price: Number(formData.price), stock: Number(formData.stock), createdAt: serverTimestamp() });
      resetForm();
    } catch { alert("Save failed!"); }
  };

  const deleteItem = async (coll, id) => {
    if (confirm("Delete permanently?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', coll, id));
    }
  };

  return (
    // FIX: Container Dashboard dibuat lebar (max-w-full) agar tidak terpotong ke samping
    <div className="max-w-full mx-auto px-4 md:px-12 py-20 flex flex-col lg:flex-row gap-8 md:gap-16 animate-in slide-in-from-bottom duration-1000">
      <aside className="lg:w-1/4 xl:w-80 space-y-6">
        <div className="bg-zinc-950 p-10 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] text-white shadow-2xl border border-white/5 relative overflow-hidden group">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>
           <h2 className="text-xl md:text-2xl font-serif font-bold italic text-[#D4AF37] tracking-widest relative z-10 uppercase">{t.adminCenter}</h2>
        </div>
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] md:rounded-[3.5rem] p-4 md:p-6 space-y-3 shadow-sm">
          {['orders', 'catalog', 'bank', 'admins'].map(tTab => (
            <button key={tTab} onClick={() => { setActiveTab(tTab); resetForm(); }} className={`w-full text-left px-8 md:px-12 py-4 md:py-5 rounded-3xl text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] transition-all ${activeTab === tTab ? 'bg-zinc-950 text-white shadow-2xl scale-105' : 'text-zinc-400 hover:bg-zinc-50'}`}>{tTab}</button>
          ))}
          <button onClick={onLogout} className="w-full text-left px-8 md:px-12 py-4 md:py-5 rounded-3xl text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-red-500 hover:bg-red-50 mt-16 transition-colors border border-red-50">{t.logout}</button>
        </div>
      </aside>

      {/* FIX: Bagian konten dibuat melebar ke samping */}
      <div className="flex-1 bg-white border border-zinc-100 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-16 shadow-sm min-h-[85vh]">
        {activeTab === 'orders' && (
          <div className="space-y-12">
            <h3 className="text-3xl md:text-4xl font-serif font-bold italic border-b pb-8 uppercase">Orders Management</h3>
            {orders.length === 0 && <p className="text-center py-20 text-zinc-400 font-bold uppercase text-[10px] tracking-widest">No active orders</p>}
            <div className="grid grid-cols-1 gap-8">
              {orders.map(o => (
                <div key={o.id} className="border border-zinc-100 p-8 rounded-[3rem] flex flex-col xl:flex-row justify-between gap-12 hover:shadow-xl transition-all bg-zinc-50/20 group">
                  <div className="flex gap-8">
                    <div className="w-32 h-44 rounded-[2rem] overflow-hidden shadow-2xl cursor-zoom-in flex-shrink-0" onClick={() => setShowOrderProof(o.proofUrl)}>
                      <img src={o.proofUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                    </div>
                    <div className="space-y-3">
                      <span className={`px-4 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${o.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>{o.status}</span>
                      <h4 className="text-xl font-bold text-zinc-900">{o.buyerName}</h4>
                      <p className="text-[10px] text-zinc-400 pt-2 font-mono leading-relaxed uppercase">
                         INV: {o.invoice} <br/>
                         TO: {o.targetRek?.bankName} <br/>
                         ITEM: {o.productName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between py-2">
                    <p className="text-2xl font-bold font-serif text-[#3a7d44]">{formatIDR(o.amount || 0)}</p>
                    <div className="flex gap-4">
                      {o.status === 'pending' && <button onClick={async () => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id), {status: 'confirmed'})} className="px-10 py-4 bg-zinc-950 text-white rounded-[1.5rem] text-[9px] font-bold uppercase shadow-xl hover:bg-[#3a7d44] transition-all">{t.approve}</button>}
                      <button onClick={() => deleteItem('orders', o.id)} className="p-4 text-zinc-300 hover:text-red-500 bg-white rounded-2xl border border-zinc-100 transition-all"><Trash2 size={20} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 md:gap-24">
            <form onSubmit={saveProduct} className="space-y-8">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#D4AF37] border-b pb-4">Product Editor</h3>
              <input type="text" placeholder="Resource Image URL" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full bg-zinc-50 border-none p-6 rounded-[2rem] outline-none font-mono text-[10px] focus:ring-1 focus:ring-black" required />
              <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 border-none p-6 rounded-[2rem] outline-none text-[11px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-black" required />
              <div className="grid grid-cols-2 gap-6">
                <input type="number" placeholder="Price (IDR)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-50 p-6 rounded-[2rem] outline-none font-bold text-[11px]" required />
                <input type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-zinc-50 p-6 rounded-[2rem] outline-none font-bold text-[11px]" required />
              </div>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, sizes: []})} className="w-full bg-zinc-50 p-6 rounded-[2rem] outline-none uppercase font-bold text-[10px] tracking-widest">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                 {SIZE_OPTIONS[formData.category]?.map(s => <button key={s} type="button" onClick={() => setFormData({...formData, sizes: formData.sizes.includes(s) ? formData.sizes.filter(x => x !== s) : [...formData.sizes, s]})} className={`px-6 py-2 rounded-2xl text-[9px] font-bold border-2 transition-all ${formData.sizes.includes(s) ? 'bg-zinc-950 text-white border-black' : 'border-zinc-100 text-zinc-400'}`}>{s}</button>)}
              </div>
              <textarea placeholder="Material details..." value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-zinc-50 p-6 rounded-[2rem] outline-none h-24 text-[11px]"></textarea>
              <button type="submit" className="w-full bg-zinc-950 text-white py-6 rounded-[3rem] text-[11px] font-bold uppercase tracking-[0.5em] shadow-2xl hover:bg-[#3a7d44] transition-all">PUBLISH CHANGES</button>
            </form>
            <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-4 no-scrollbar xl:border-l xl:pl-16">
               {products.map(p => (
                 <div key={p.id} className="p-6 border border-zinc-100 rounded-[2.5rem] flex items-center justify-between bg-white shadow-sm group">
                    <div className="flex items-center gap-6"><img src={p.imageUrl} className="w-16 h-16 rounded-[1.2rem] object-cover border border-zinc-50" /><div><h4 className="text-[11px] font-bold uppercase text-zinc-900">{p.name}</h4><p className="text-[10px] font-serif text-[#D4AF37] mt-1">{formatIDR(p.price)}</p></div></div>
                    <div className="flex gap-2"><button onClick={() => {setIsEditing(p.id); setFormData(p); window.scrollTo({top: 0, behavior: 'smooth'});}} className="p-4 text-zinc-300 hover:text-black bg-zinc-50 rounded-2xl"><Edit2 size={18} /></button><button onClick={() => deleteItem('products', p.id)} className="p-4 text-zinc-300 hover:text-red-500 bg-zinc-50 rounded-2xl"><Trash2 size={18} /></button></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
             <form onSubmit={async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rekening'), rekData); resetForm(); }} className="space-y-10 bg-zinc-50/50 p-12 rounded-[3.5rem]">
                <h3 className="text-[11px] font-bold uppercase text-zinc-400 tracking-[0.3em]">Funding Account</h3>
                <select value={rekData.bankName} onChange={e => setRekData({...rekData, bankName: e.target.value})} className="w-full bg-white p-6 rounded-[2rem] outline-none font-bold text-[11px] tracking-widest shadow-sm">
                  {Object.keys(PAYMENT_LOGOS).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <input type="text" placeholder="Account Number" value={rekData.accountNumber} onChange={e => setRekData({...rekData, accountNumber: e.target.value})} className="w-full bg-white p-6 rounded-[2rem] outline-none text-[11px] font-bold tracking-widest" required />
                <input type="text" placeholder="Account Holder Name" value={rekData.accountHolder} onChange={e => setRekData({...rekData, accountHolder: e.target.value})} className="w-full bg-white p-6 rounded-[2rem] outline-none text-[11px] font-bold uppercase tracking-widest" required />
                <button type="submit" className="w-full bg-zinc-950 text-white py-6 rounded-[3rem] text-[11px] font-bold uppercase tracking-[0.5em] shadow-2xl">ACTIVATE</button>
             </form>
             <div className="space-y-6">
               {rekening.map(rek => (
                 <div key={rek.id} className="p-10 border border-zinc-100 rounded-[3rem] flex justify-between items-center bg-white shadow-sm group">
                    <div className="flex items-center gap-10"><div className="w-24 grayscale group-hover:grayscale-0 transition-all duration-700"><img src={PAYMENT_LOGOS[rek.bankName]} className="max-h-full" /></div><div><p className="text-xl font-mono font-bold">{rek.accountNumber}</p><p className="text-[9px] uppercase font-bold text-zinc-400 mt-2">A.N {rek.accountHolder}</p></div></div>
                    <button onClick={() => deleteItem('rekening', rek.id)} className="p-4 text-zinc-200 hover:text-red-500 rounded-xl"><Trash2 size={20} /></button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
             <div className="space-y-10 bg-zinc-950 p-12 rounded-[4rem] text-white">
               <h3 className="text-2xl font-serif font-bold italic text-[#D4AF37] uppercase tracking-widest">Admin Control</h3>
               <form onSubmit={async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'admins'), newAdmin); resetForm(); alert("Admin Added!"); }} className="space-y-8">
                 <input type="text" placeholder="Username" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] outline-none text-[11px] font-bold uppercase" required />
                 <input type="password" placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] outline-none text-[11px] font-bold" required />
                 <button type="submit" className="w-full bg-[#D4AF37] text-black py-6 rounded-[3rem] text-[11px] font-bold uppercase tracking-[0.5em] shadow-2xl">GRANT ACCESS</button>
               </form>
             </div>
             <div className="space-y-6">
                {adminUsers.map(adm => (
                  <div key={adm.id} className="p-10 border border-zinc-100 rounded-[3rem] flex justify-between items-center bg-white shadow-sm">
                     <div className="flex items-center gap-8"><div className="w-16 h-16 bg-zinc-50 rounded-[2rem] flex items-center justify-center text-[#D4AF37]"><User size={30} /></div><div><p className="text-xl font-bold uppercase text-zinc-900">{adm.username}</p><p className="text-[10px] text-zinc-300 font-mono mt-1">SECURED IDENTITY</p></div></div>
                     <button onClick={() => deleteItem('admins', adm.id)} className="p-4 text-zinc-200 hover:text-red-500"><Trash2 size={20} /></button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {showOrderProof && (
        <div className="fixed inset-0 z-[400] bg-black/98 flex items-center justify-center p-12 animate-in fade-in" onClick={() => setShowOrderProof(null)}>
           <img src={showOrderProof} className="max-w-full max-h-full object-contain rounded-[4rem] shadow-3xl border border-white/5" />
           <button className="absolute top-12 right-12 text-white bg-white/10 p-7 rounded-full"><X size={48} /></button>
        </div>
      )}
    </div>
  );
}

function AdminLoginModal({ adminUsers, onSuccess, onClose }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  
  const handle = (e) => { 
    e.preventDefault(); 
    const isMaster = (u === 'admin' && p === 'admin123');
    const isDynamic = adminUsers.find(a => a.username === u && a.password === p);
    if(isMaster || isDynamic) onSuccess(); 
    else alert('Invalid Credentials!'); 
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in zoom-in">
      <div className="bg-white w-full max-w-md rounded-[4rem] p-16 relative shadow-3xl overflow-hidden border border-zinc-100">
        <button onClick={onClose} className="absolute top-10 right-10 text-zinc-200 hover:text-black transition-colors"><X size={36} /></button>
        <div className="text-center mb-16">
           <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-zinc-100"><Lock size={40} className="text-[#D4AF37]" /></div>
           <h3 className="text-3xl font-serif font-bold italic tracking-tighter uppercase text-zinc-900">Security Gate</h3>
        </div>
        <form onSubmit={handle} className="space-y-8">
          <input type="text" placeholder="Username" value={u} onChange={e => setU(e.target.value)} className="w-full bg-zinc-50 border-none px-8 py-6 rounded-[2rem] outline-none text-[11px] font-bold uppercase tracking-widest shadow-inner" required />
          <input type="password" placeholder="Password" value={p} onChange={e => setP(e.target.value)} className="w-full bg-zinc-50 border-none px-8 py-6 rounded-[2rem] outline-none text-[11px] transition-all shadow-inner" required />
          <button type="submit" className="w-full bg-zinc-950 text-white py-6 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.6em] hover:bg-[#D4AF37] transition-all shadow-3xl">AUTHORIZE</button>
        </form>
      </div>
    </div>
  );
}
