import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signOut
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
  setDoc,
  getDocs,
  limit,
  where,
  orderBy
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
  Check as CheckIcon, 
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
  ShieldAlert,
  ChevronRight,
  Info,
  Heart,
  Share2,
  Sparkles,
  Zap,
  ShoppingBasket,
  CreditCard,
  Truck,
  Verified,
  Globe,
  Settings,
  AlertCircle,
  Scissors,
  Palette,
  Gift,
  RefreshCw,
  Crown,
  TrendingUp,
  Award,
  ShieldCheck,
  MousePointer2,
  Box,
  Facebook,
  Twitter,
  MessageCircle,
  PieChart,
  Users,
  Bell,
  ArrowUpRight,
  Eye,
  History,
  FileText,
  Activity,
  Layers as LayersIcon,
  Tag,
  CreditCard as PaymentIcon,
  ShoppingBag as BagIcon,
  Map,
  Truck as DeliveryIcon,
  Check as SuccessIcon,
  ChevronDown,
  ArrowDownRight,
  Filter,
  LogOut,
  Edit,
  ExternalLink,
  ChevronUp,
  Target,
  ZapOff,
  UserCheck,
  Award as AwardIcon,
  BarChart3,
  Globe2,
  ShoppingBag as ShoppingBagIcon,
  ChevronRight as ChevronRightIcon,
  X as CloseIcon,
  ArrowRight as ArrowRightIcon,
  HeartPulse,
  Bookmark,
  Smartphone,
  Cpu,
  Trophy,
  Coffee,
  Diamond,
  Briefcase,
  Layers as LayersMenu
} from 'lucide-react';

/**
 * ==========================================================================================
 * --- DEVI OFFICIAL LUXURY BOUTIQUE ECOSYSTEM ---
 * VERSION: 12.0.1 (MAISON MAGNUM - ERROR FIXED)
 * ==========================================================================================
 */

// --- GLOBAL CONFIGURATION ---
const BRAND_PRIMARY = "#D4AF37"; 
const BRAND_DARK = "#050505";

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
const CATEGORIES = ['Semua', 'Baju', 'Dress', 'Hijab', 'Abaya', 'Koko', 'Set Keluarga', 'Tas', 'Aksesoris'];
const BANK_LOGOS = {
  "BCA": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
  "BRI": "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_Logo.svg",
  "Mandiri": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
  "CIMB Niaga": "https://upload.wikimedia.org/wikipedia/commons/5/5e/CIMB_Niaga_logo.svg",
  "DANA": "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dan_automotive.png",
  "OVO": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg",
  "GoPay": "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });
const storage = getStorage(firebaseApp);

const formatIDR = (amount) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val);
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
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message: String(message), type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (err) { console.error("Auth System Error", err); } 
      finally { setTimeout(() => setLoading(false), 2000); }
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
    });
    
    return () => { unsubP(); unsubR(); unsubO(); unsubA(); };
  }, [user]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = String(p.name || '').toLowerCase();
      const matchCat = categoryFilter === 'Semua' || p.category === categoryFilter;
      const matchSearch = name.includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, categoryFilter, searchTerm]);

  if (loading) return <PremiumLoader />;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased overflow-x-hidden selection:bg-[#D4AF37] selection:text-white">
      
      {/* NOTIFICATION HUB */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[5000] flex flex-col gap-2 w-full max-w-xs px-4 pointer-events-none">
        {notifications.map(n => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>

      <Header 
        cartCount={cart.length} 
        isAdmin={isAdminLoggedIn} 
        setView={setView} 
        setCategoryFilter={setCategoryFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div className="pt-16 md:pt-24">
        <main>
          {view === 'shop' && (
            <div className="animate-in fade-in duration-700">
              <HeroSection onExplore={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })} />
              <CraftsmanshipSection />
              
              <div id="catalog" className="bg-white/95 backdrop-blur-xl border-b border-zinc-100 sticky top-16 md:top-24 z-40 overflow-x-auto no-scrollbar shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-start md:justify-center gap-2 whitespace-nowrap">
                  {CATEGORIES.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setCategoryFilter(c)} 
                      className={`text-[10px] uppercase font-bold tracking-widest transition-all px-4 py-2 rounded-full border-none cursor-pointer outline-none ${categoryFilter === c ? 'bg-black text-[#D4AF37]' : 'text-zinc-400 bg-zinc-50 hover:bg-zinc-100'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <ProductGrid products={filteredProducts} onView={(p) => { setSelectedProduct(p); setView('detail'); window.scrollTo(0,0); }} />
              
              <MembershipBanner />
              <TrendingSelection products={products.slice(0, 4)} onView={(p) => { setSelectedProduct(p); setView('detail'); window.scrollTo(0,0); }} />
              <SustainabilityReport />
            </div>
          )}

          {view === 'detail' && selectedProduct && (
            <ProductDetailView 
              product={selectedProduct} 
              onBack={() => setView('shop')} 
              onBuy={(size, price) => { 
                setSelectedProduct({...selectedProduct, chosenSize: size, chosenPrice: price}); 
                setView('checkout'); 
              }}
              onAddToCart={(p) => {
                setCart([...cart, p]);
                notify(`Ditambahkan ke Bag.`, "success");
              }}
              notify={notify}
            />
          )}

          {view === 'checkout' && selectedProduct && (
            <CheckoutView 
              product={selectedProduct} 
              rekening={rekening} 
              onComplete={() => { setView('shop'); }} 
              onBack={() => setView('shop')} 
              notify={notify}
            />
          )}

          {view === 'cart' && (
            <CartView 
              items={cart} 
              onRemove={(idx) => {
                const newCart = [...cart];
                newCart.splice(idx, 1);
                setCart(newCart);
                notify("Item dilepaskan.");
              }} 
              onCheckout={() => {
                if (cart.length > 0) {
                  setSelectedProduct(cart[0]);
                  setView('checkout');
                }
              }}
            />
          )}

          {view === 'login' && (
            <AdminLogin 
              creds={adminCreds} 
              onLoginSuccess={() => { setIsAdminLoggedIn(true); setView('admin'); }} 
              onBack={() => setView('shop')} 
              notify={notify} 
            />
          )}
          
          {view === 'admin' && isAdminLoggedIn && (
            <AdminDashboard 
              products={products} 
              orders={orders} 
              rekening={rekening} 
              appId={appId} 
              onLogout={() => { setIsAdminLoggedIn(false); setView('shop'); }} 
              notify={notify}
            />
          )}
        </main>
      </div>

      <Footer setView={setView} />
    </div>
  );
}

/**
 * --- SUB-KOMPONEN: SHARED INTERFACE ---
 */

function PremiumLoader() {
  return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
      <h2 className="font-serif text-lg text-[#D4AF37] tracking-[0.2em] font-bold uppercase">DEVI</h2>
    </div>
  );
}

function Header({ cartCount, isAdmin, setView, setCategoryFilter, searchTerm, setSearchTerm }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'h-14 bg-white shadow-md' : 'h-16 md:h-20 bg-white/90'} backdrop-blur-lg border-b border-zinc-100`}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        
        <div className="flex-1 hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="bg-zinc-50 border-none rounded-full pl-9 pr-4 py-2 text-xs w-40 focus:w-60 focus:bg-white transition-all outline-none" 
            />
          </div>
        </div>

        <div className="flex-1 flex justify-start md:justify-center">
          <div className="text-center cursor-pointer" onClick={() => setView('shop')}>
            <h1 className="text-base md:text-xl font-serif tracking-[0.2em] font-bold text-black uppercase leading-none whitespace-nowrap">
              DEVI<span className="text-[#D4AF37]">_OFFICIAL</span>
            </h1>
          </div>
        </div>

        <div className="flex-1 flex justify-end gap-2 md:gap-4 items-center">
           <button onClick={() => setView('cart')} className="relative p-2.5 hover:bg-zinc-50 rounded-full transition-all bg-transparent border-none cursor-pointer outline-none flex items-center justify-center">
             <BagIcon size={20} className="text-zinc-800" />
             {cartCount > 0 && <span className="absolute top-0 right-0 bg-[#D4AF37] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">{cartCount}</span>}
           </button>
           
           <div className="flex items-center gap-2">
              {isAdmin ? (
                <button onClick={() => setView('admin')} className="p-2.5 bg-black text-[#D4AF37] rounded-full transition-all border-none cursor-pointer outline-none">
                  <LayoutDashboard size={18} />
                </button>
              ) : (
                <button onClick={() => setView('login')} className="p-2.5 bg-zinc-50 rounded-full hover:bg-black hover:text-white transition-all border-none cursor-pointer outline-none">
                  <Key size={18} />
                </button>
              )}
           </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onExplore }) {
  return (
    <section className="relative h-[50vh] md:h-[85vh] flex items-center justify-center overflow-hidden bg-[#070707] text-white">
      <img src="https://images.unsplash.com/photo-1549439602-43ebcb232811?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Hero" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      
      <div className="relative z-10 text-center px-6 max-w-4xl space-y-4">
        <div className="space-y-2">
           <p className="text-[9px] uppercase tracking-[0.8em] font-bold text-[#D4AF37]">Pure Excellence</p>
           <h2 className="text-2xl md:text-7xl font-serif italic font-bold uppercase leading-tight text-white">Keanggunan <br className="md:hidden"/> <span className="text-[#D4AF37]">Abadi</span></h2>
        </div>
        <p className="text-zinc-300 text-[10px] md:text-lg max-w-lg mx-auto font-medium tracking-wide uppercase italic opacity-80">
          Kurasi kemewahan material premium terpilih.
        </p>
        <button onClick={onExplore} className="mt-2 px-8 py-3 bg-[#D4AF37] text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-xl border-none cursor-pointer outline-none">
          Belanja Sekarang
        </button>
      </div>
    </section>
  );
}

function CraftsmanshipSection() {
  return (
    <section className="bg-white py-10 md:py-24 border-y border-zinc-50 px-6">
       <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
         {[
           { icon: <Scissors size={24} />, title: "Precision Cut", desc: "Dikerjakan manual oleh penjahit master." },
           { icon: <Palette size={24} />, title: "Elite Textiles", desc: "Material premium bersertifikat standar global." },
           { icon: <Crown size={24} />, title: "Seal of Royalty", desc: "Sentuhan akhir elegan dengan detail kristal." }
         ].map((item, idx) => (
           <div key={idx} className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-[#D4AF37]">
                 {item.icon}
              </div>
              <div>
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-900">{item.title}</h4>
                 <p className="text-zinc-400 text-[9px] leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
              </div>
           </div>
         ))}
       </div>
    </section>
  );
}

function MembershipBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10 md:py-24">
       <div className="bg-[#0D0D0D] rounded-3xl md:rounded-[4rem] p-8 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl">
         <div className="relative z-10 space-y-6 max-w-lg text-center md:text-left">
            <h2 className="text-xl md:text-5xl font-serif font-bold italic tracking-tight uppercase text-white leading-tight">Privilege <span className="text-[#D4AF37]">Member</span></h2>
            <p className="text-zinc-500 text-[10px] md:text-lg leading-relaxed">Akses eksklusif koleksi Maison terbaru dan penawaran spesial.</p>
            <button className="px-8 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full border-none cursor-pointer outline-none active:scale-95 shadow-xl">Gabung Sekarang</button>
         </div>
         <div className="relative z-10 w-full md:w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1020&auto=format&fit=crop" className="w-full h-full object-cover" alt="Promo" />
         </div>
       </div>
    </section>
  );
}

function TrendingSelection({ products, onView }) {
  return (
    <section className="py-10 md:py-24 bg-[#080808] text-white px-4 border-t border-[#D4AF37]/10">
       <div className="max-w-7xl mx-auto space-y-10">
         <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2"><TrendingUp className="text-[#D4AF37]" size={16} /><span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]">Seasonal Trends</span></div>
            <h2 className="text-2xl md:text-6xl font-serif font-bold italic tracking-tight uppercase leading-none">The <span className="text-[#D4AF37]">Vanguard</span></h2>
         </div>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-12">
            {products.map(p => (
              <div key={p.id} onClick={() => onView(p)} className="cursor-pointer space-y-4">
                 <div className="relative aspect-[3/4.5] rounded-2xl overflow-hidden shadow-xl border border-white/5 transition-all">
                    <img src={p.imageURL} className="w-full h-full object-cover" alt=""/>
                 </div>
                 <div className="text-center space-y-1">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 truncate">{String(p.name)}</h4>
                    <p className="text-sm font-serif font-bold italic text-white">{formatIDR(p.price)}</p>
                 </div>
              </div>
            ))}
         </div>
       </div>
    </section>
  );
}

function SustainabilityReport() {
  return (
    <section className="py-12 md:py-32 bg-white border-t border-zinc-50 px-6 overflow-hidden">
       <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 md:gap-32">
          <div className="flex-1 space-y-6 text-center lg:text-left">
             <div className="flex items-center gap-4 justify-center lg:justify-start"><div className="w-10 h-[1px] bg-[#D4AF37]"></div><span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#D4AF37]">Ethics</span></div>
             <h2 className="text-2xl md:text-7xl font-serif font-bold italic tracking-tighter uppercase leading-tight text-zinc-950">Maison <span className="text-zinc-300">DNA</span></h2>
             <p className="text-zinc-500 text-[10px] md:text-xl leading-relaxed italic border-l-2 border-[#D4AF37]/30 pl-6">Kemewahan abadi berawal dari tanggung jawab sosial dalam setiap produksi.</p>
             <button className="px-10 py-3 border border-zinc-200 rounded-full text-[9px] font-bold uppercase tracking-widest text-zinc-800 hover:bg-black hover:text-white transition-all duration-500 outline-none">Selengkapnya</button>
          </div>
       </div>
    </section>
  );
}

function ProductGrid({ products, onView }) {
  if (!products || products.length === 0) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
      <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">Memuat Koleksi...</p>
    </div>
  );
  
  return (
    <section className="max-w-7xl mx-auto px-4 py-8 md:py-24">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-12 gap-y-10 md:gap-y-24">
        {products.map((p) => (
          <div key={p.id} className="group cursor-pointer flex flex-col items-center" onClick={() => onView(p)}>
            <div className="relative aspect-[3/4.6] w-full overflow-hidden rounded-2xl md:rounded-[3rem] bg-zinc-50 shadow-sm transition-transform duration-500 group-hover:-translate-y-2">
              <img src={p.imageURL} className="w-full h-full object-cover" alt={p.name} />
              <div className="absolute bottom-3 right-3 bg-black/80 text-[#D4AF37] px-3 py-1 rounded-full text-[8px] font-bold tracking-widest uppercase">
                {String(p.category)}
              </div>
            </div>
            <div className="text-center mt-4 space-y-1 w-full px-2">
              <h3 className="text-[9px] md:text-xs font-serif font-medium tracking-wide text-zinc-500 uppercase truncate">
                {String(p.name)}
              </h3>
              <p className="text-sm md:text-2xl font-bold text-black font-serif italic leading-none">
                {formatIDR(p.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductDetailView({ product, onBack, onBuy, onAddToCart, notify }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [currentPrice, setCurrentPrice] = useState(Number(product.price));

  useEffect(() => {
    if (selectedSize && product.sizePrices && product.sizePrices[selectedSize]) {
      setCurrentPrice(Number(product.sizePrices[selectedSize]));
    } else {
      setCurrentPrice(Number(product.price));
    }
  }, [selectedSize, product]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-16">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 mb-6 text-[10px] font-bold uppercase tracking-widest bg-transparent border-none cursor-pointer outline-none group hover:text-black">
        <ChevronLeft size={16} /> Kembali
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-24 items-start">
        <div className="w-full aspect-[3/4.5] bg-zinc-50 rounded-2xl overflow-hidden shadow-xl border border-zinc-100">
          <img src={product.imageURL} className="w-full h-full object-cover" alt={product.name} />
        </div>

        <div className="flex flex-col space-y-8">
          <div className="space-y-3">
            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest border-l-2 border-[#D4AF37] pl-4">
              {String(product.category).toUpperCase()}
            </p>
            <h2 className="text-2xl md:text-5xl font-serif font-bold uppercase tracking-tight leading-tight">{String(product.name)}</h2>
            <p className="text-3xl md:text-6xl font-bold text-black font-serif italic">{formatIDR(currentPrice)}</p>
          </div>

          <div className="bg-zinc-50 p-6 md:p-10 rounded-2xl border border-zinc-100">
             <span className="text-[9px] font-bold uppercase tracking-widest text-black border-b border-zinc-200 block mb-4 pb-1">Materials & Story</span>
             <p className="text-zinc-700 leading-relaxed text-xs md:text-lg italic font-serif">
                {String(product.description || "Kemewahan yang dipersonalisasi. Setiap jahitan mencerminkan dedikasi butik kami.")}
             </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-black flex items-center gap-2">
              <LayersIcon size={16} className="text-[#D4AF37]" /> Pilih Ukuran
            </h4>
            <div className="flex flex-wrap gap-2">
               {(product.sizes || []).map(s => (
                 <button 
                   key={s}
                   onClick={() => setSelectedSize(s)} 
                   className={`w-11 h-11 md:w-16 md:h-16 rounded-xl flex items-center justify-center font-bold text-xs border transition-all cursor-pointer outline-none ${selectedSize === s ? 'bg-black text-[#D4AF37] border-black scale-105 shadow-lg' : 'bg-white border-zinc-100 text-zinc-400'}`}
                 >
                   {String(s)}
                 </button>
               ))}
            </div>

            <div className="flex flex-col gap-3 pt-6">
              <button 
                onClick={() => { if(!selectedSize) return notify("Pilih ukuran mewah Anda.", "error"); onBuy(selectedSize, currentPrice); }} 
                className="w-full bg-black text-[#D4AF37] py-4 md:py-6 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-xl border-none cursor-pointer flex items-center justify-center gap-3 outline-none active:scale-95"
              >
                CHECKOUT SEKARANG <ArrowRight size={18} />
              </button>
              
              <button 
                onClick={() => { if(!selectedSize) return notify("Pilih ukuran terlebih dahulu!", "error"); onAddToCart({...product, chosenSize: selectedSize, chosenPrice: currentPrice}); }}
                className="w-full bg-zinc-50 border border-zinc-200 py-3 md:py-5 rounded-full text-[9px] font-bold uppercase tracking-widest text-zinc-800 cursor-pointer outline-none"
              >
                Tambah ke Tas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutView({ product, rekening, onComplete, onBack, notify }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [shipping, setShipping] = useState({ name: '', address: '', phone: '', dropship: false });
  const [payment, setPayment] = useState({ 
    invoice: `INV-DEVI-${Math.floor(Date.now() / 1000).toString().slice(-6)}`,
    transferTo: '', originBank: '', senderName: '', amount: Number(product.chosenPrice || product.price), proofImage: '', status: 'pending'
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `artifacts/${appId}/public/data/proofs/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      setPayment(prev => ({ ...prev, proofImage: url }));
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const submitFinalOrder = async () => {
    if (!payment.senderName || !payment.originBank || !shipping.name || !shipping.address || !shipping.phone) return notify("Lengkapi seluruh formulir.", "error");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { 
        ...payment, shipping, productName: String(product.name), productSize: String(product.chosenSize), createdAt: serverTimestamp() 
      });
      setStep(4);
    } catch (e) { notify(e.message, "error"); }
  };

  return (
    <div className="max-w-md mx-auto py-6 md:py-16 px-4 font-bold uppercase">
       <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden relative">
          <button onClick={onBack} className="absolute top-4 right-4 p-2 text-zinc-400 bg-transparent border-none cursor-pointer z-50"><X size={20} /></button>
          
          {step === 1 && (
            <div className="p-6 md:p-10 space-y-8">
               <h3 className="text-lg font-serif italic border-b border-zinc-50 pb-3">Informasi Client</h3>
               <div className="space-y-6">
                  <div className="border-b border-zinc-100 focus-within:border-[#D4AF37] pb-1">
                    <label className="text-[8px] text-zinc-400 tracking-widest">Nama Lengkap</label>
                    <input className="w-full py-2 text-xs font-bold border-none outline-none bg-transparent" placeholder="Sherly Adelia" value={shipping.name} onChange={e=>setShipping({...shipping, name:e.target.value})}/>
                  </div>
                  <div className="border-b border-zinc-100 focus-within:border-[#D4AF37] pb-1">
                    <label className="text-[8px] text-zinc-400 tracking-widest">Nomor HP</label>
                    <input className="w-full py-2 text-xs font-bold border-none outline-none bg-transparent" placeholder="0812..." value={shipping.phone} onChange={e=>setShipping({...shipping, phone:e.target.value})}/>
                  </div>
                  <div className="border-b border-zinc-100 focus-within:border-[#D4AF37] pb-1">
                    <label className="text-[8px] text-zinc-400 tracking-widest">Alamat Lengkap</label>
                    <textarea className="w-full py-2 text-xs font-bold border-none outline-none bg-transparent h-20 resize-none" placeholder="Alamat pengiriman..." value={shipping.address} onChange={e=>setShipping({...shipping, address:e.target.value})}/>
                  </div>
               </div>
               <button onClick={()=>setStep(2)} className="w-full bg-[#3b82f6] text-white py-4 rounded-full text-[10px] font-bold border-none cursor-pointer shadow-xl">LANJUT KE PEMBAYARAN</button>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 md:p-10 space-y-6">
               <div className="text-center"><h3 className="text-lg font-serif italic uppercase">Pilih Bank</h3></div>
               <div className="space-y-3">
                  {rekening.map(rek => (
                    <div key={rek.id} onClick={()=>{ setPayment({...payment, transferTo: `${rek.bankName} - ${rek.accountNumber} - ${rek.accountHolder}`}); setStep(3); }} className="p-4 border border-zinc-100 rounded-2xl hover:border-[#D4AF37] cursor-pointer transition-all flex items-center justify-between bg-zinc-50/50">
                       <div className="space-y-1">
                          <img src={BANK_LOGOS[rek.bankName]} className="h-3 object-contain grayscale" alt=""/>
                          <p className="text-sm font-mono tracking-tighter">{String(rek.accountNumber)}</p>
                          <p className="text-[8px] text-zinc-400">A.N {String(rek.accountHolder)}</p>
                       </div>
                       <ChevronRight size={18} className="text-zinc-300"/>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 md:p-10 space-y-6">
               <h3 className="text-center text-xl font-serif italic border-b border-zinc-50 pb-4 uppercase leading-none">Konfirmasi</h3>
               <div className="space-y-4">
                  <div className="p-4 bg-zinc-900 rounded-xl text-[9px] text-[#D4AF37] tracking-widest uppercase text-center">{String(payment.transferTo)}</div>
                  <input className="w-full bg-zinc-50 p-4 rounded-xl border-none text-[10px] outline-none" placeholder="Bank Asal" value={payment.originBank} onChange={e=>setPayment({...payment, originBank:e.target.value})}/>
                  <input className="w-full bg-zinc-50 p-4 rounded-xl border-none text-[10px] outline-none" placeholder="Nama Pengirim" value={payment.senderName} onChange={e=>setPayment({...payment, senderName:e.target.value})}/>
                  
                  <div onClick={()=>document.getElementById('uPf').click()} className="w-full aspect-video border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden relative shadow-inner">
                    {payment.proofImage ? <img src={payment.proofImage} className="w-full h-full object-cover"/> : <div className="text-center text-zinc-300"><Upload size={32} className="mx-auto mb-1 opacity-50" /><p className="text-[8px] uppercase tracking-widest">Upload Bukti Transfer</p></div>}
                    {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" size={24}/></div>}
                    <input type="file" id="uPf" className="hidden" accept="image/*" onChange={handleUpload}/>
                  </div>
               </div>
               <button onClick={submitFinalOrder} className="w-full bg-black text-[#D4AF37] py-4 rounded-full text-[10px] font-bold border-none cursor-pointer shadow-xl active:scale-95">KONFIRMASI SEKARANG</button>
            </div>
          )}

          {step === 4 && (
            <div className="p-12 text-center space-y-6 animate-in zoom-in duration-700">
               <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl"><SuccessIcon size={32}/></div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-serif">Berhasil</h3>
                  <p className="text-[10px] text-zinc-400 tracking-widest uppercase">Pesanan Anda telah diterima.</p>
               </div>
               <button onClick={onComplete} className="w-full bg-black text-[#D4AF37] py-4 rounded-full text-[10px] font-bold border-none outline-none cursor-pointer active:scale-95">KEMBALI KE HOME</button>
            </div>
          )}
       </div>
    </div>
  );
}

function AdminDashboard({ products, orders, rekening, appId, onLogout, notify }) {
  const [tab, setTab] = useState('inventory');
  const [saving, setSaving] = useState(false);
  const [instaUrl, setInstaUrl] = useState('');
  const [formData, setFormData] = useState({ 
    imageURL: '', name: '', price: '', category: 'Baju', description: '', sizes: [] 
  });

  const publishProduct = async () => {
    if (!formData.name.trim() || !formData.price || !formData.imageURL) return notify("Lengkapi data Maison!", "error");
    setSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), { ...formData, price: Number(formData.price), createdAt: serverTimestamp() });
      setFormData({ imageURL: '', name: '', price: '', category: 'Baju', description: '', sizes: [] });
      setInstaUrl('');
      notify("Maha karya dipublikasikan.", "success");
    } catch (e) { notify(e.message, "error"); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 font-bold uppercase text-black">
      <aside className="md:w-64 space-y-4">
         <div className="bg-zinc-950 p-6 rounded-3xl text-white border border-white/5">
           <Crown className="text-[#D4AF37] mb-2" size={32} />
           <h2 className="text-xl font-serif italic">Admin Panel</h2>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-zinc-100 flex flex-col gap-2 shadow-sm">
            {['inventory', 'orders'].map(t => (
              <button key={t} onClick={()=>setTab(t)} className={`text-left px-6 py-3 rounded-xl text-[10px] tracking-widest border-none cursor-pointer ${tab === t ? 'bg-black text-[#D4AF37]' : 'text-zinc-400 bg-transparent hover:bg-zinc-50'}`}>{t.toUpperCase()}</button>
            ))}
            <button onClick={onLogout} className="text-left px-6 py-3 rounded-xl text-[10px] text-red-500 border-none bg-transparent cursor-pointer hover:bg-red-50 tracking-widest mt-2">LOGOUT</button>
         </div>
      </aside>

      <div className="flex-1 bg-white p-6 md:p-12 rounded-3xl border border-zinc-100 min-h-[60vh] shadow-sm">
         {tab === 'inventory' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="aspect-[3/4.6] bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-100 overflow-hidden relative flex items-center justify-center">
                    {formData.imageURL ? <img src={formData.imageURL} className="w-full h-full object-cover"/> : <Instagram size={48} className="text-zinc-200 opacity-20" />}
                 </div>
                 <div className="flex gap-2">
                    <input className="flex-1 bg-zinc-50 p-4 rounded-xl border-none text-[10px] font-bold outline-none shadow-inner" placeholder="Paste Link IG..." value={instaUrl} onChange={e=>setInstaUrl(e.target.value)}/>
                    <button onClick={()=>{ 
                      const clean = instaUrl.split('?')[0]; 
                      setFormData({...formData, imageURL: `https://images.weserv.nl/?url=${encodeURIComponent(clean.endsWith('/') ? clean + 'media/?size=l' : clean + '/media/?size=l')}&w=1000&output=jpg`});
                    }} className="bg-black text-[#D4AF37] px-4 rounded-xl text-[9px] border-none cursor-pointer">FETCH</button>
                 </div>
              </div>
              <div className="space-y-4">
                 <input className="w-full bg-zinc-50 p-4 rounded-xl border-none text-xs font-bold outline-none" placeholder="Nama Produk" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                 <input type="number" className="w-full bg-zinc-50 p-4 rounded-xl border-none text-xs font-bold outline-none" placeholder="Harga IDR" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                 <textarea className="w-full bg-zinc-50 p-4 rounded-2xl border-none text-xs italic h-32 outline-none resize-none shadow-inner" placeholder="Product story..." value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/>
                 <button onClick={publishProduct} disabled={saving} className="w-full bg-black text-[#D4AF37] py-4 rounded-full text-[10px] tracking-widest border-none cursor-pointer active:scale-95">
                    {saving ? "PRODUCING..." : "PUBLISH KOLEKSI"}
                 </button>
              </div>
           </div>
         )}
         
         {tab === 'orders' && (
           <div className="space-y-4">
              {orders.map(o => (
                <div key={o.id} className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between border border-zinc-100 shadow-sm">
                   <div className="flex items-center gap-4 flex-1">
                      <img src={o.proofImage} className="w-12 h-16 rounded-xl object-cover shadow-md cursor-pointer" onClick={()=>window.open(o.proofImage, '_blank')}/>
                      <div className="space-y-1">
                         <span className="text-[7px] font-bold px-2 py-0.5 rounded-full uppercase border bg-white">{String(o.status)}</span>
                         <h4 className="text-[10px] font-serif italic truncate max-w-[120px]">{String(o.shipping?.name)}</h4>
                         <p className="text-[10px] text-[#D4AF37] font-bold">{formatIDR(o.amount)}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      {o.status === 'pending' && <button onClick={async()=>await updateDoc(doc(db,'artifacts',appId,'public','data', 'orders', o.id), {status:'confirmed'})} className="px-3 py-2 bg-black text-[#D4AF37] rounded-lg text-[8px] border-none cursor-pointer">Confirm</button>}
                      <button onClick={async()=>await deleteDoc(doc(db,'artifacts',appId,'public','data','orders',o.id))} className="p-2 text-red-500 bg-transparent border-none cursor-pointer outline-none"><Trash2 size={16}/></button>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
}

function NotificationItem({ notification }) {
  const { message, type } = notification;
  return (
    <div className={`p-4 rounded-2xl shadow-xl border animate-in slide-in-from-top-10 duration-700 backdrop-blur-xl flex items-center gap-3 pointer-events-auto ${
      type === 'success' ? 'bg-green-50/95 border-green-100 text-green-950' : 
      type === 'error' ? 'bg-red-50/95 border-red-100 text-red-950' : 'bg-white/95 border-zinc-100 text-black'
    }`}>
      <div className={`p-2 rounded-lg ${type === 'success' ? 'bg-green-400 text-white' : 'bg-black text-[#D4AF37]'}`}>
        {type === 'success' ? <SuccessIcon size={14} /> : <Bell size={14} />}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest">{String(message)}</p>
    </div>
  );
}

function Footer({ setView }) {
  return (
    <footer className="bg-[#030303] text-white pt-16 md:pt-32 pb-12 px-6 border-t-[4px] border-[#D4AF37] relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 font-bold uppercase">
        <div className="space-y-4">
           <h2 className="text-2xl md:text-5xl font-serif font-bold italic tracking-widest text-[#D4AF37] leading-none">DEVI OFFICIAL</h2>
           <p className="text-zinc-500 text-[10px] leading-relaxed italic border-l border-zinc-900 pl-6 uppercase opacity-60">Elevating modest fashion to a global standard of absolute luxury.</p>
        </div>
        <div className="space-y-4">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-100 border-b border-zinc-900 pb-2 italic">Vault Security</h4>
           <div className="flex gap-4 opacity-20 grayscale hover:opacity-100 transition-all">
              {Object.values(BANK_LOGOS).slice(0,3).map((l, i) => <img key={i} src={l} className="h-4 object-contain" alt="" />)}
           </div>
        </div>
        <div className="space-y-4">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-100 border-b border-zinc-900 pb-2 italic">Concierge</h4>
           <div className="text-[9px] text-zinc-500 tracking-widest space-y-2 uppercase italic">
              <p>Jakarta HQ, Indonesia</p>
              <p>+62 812 9988 7766</p>
           </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="text-zinc-800 text-[8px] uppercase tracking-[0.4em] italic font-bold">© 2024 DEVI_OFFICIAL LUXURY GROUP</div>
         <button onClick={() => setView('login')} className="flex items-center gap-2 text-zinc-700 text-[10px] tracking-widest hover:text-[#D4AF37] transition-all border border-zinc-900 px-6 py-2 rounded-full bg-transparent cursor-pointer group active:scale-95">
            <ShieldAlert size={16} /> <span>ADMIN</span>
         </button>
      </div>
    </footer>
  );
}

function AdminLogin({ creds, onLoginSuccess, onBack, notify }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (u.trim().toLowerCase() === (creds?.username || 'admin').toLowerCase() && p === (creds?.password || 'admin123')) {
        onLoginSuccess();
      } else { notify("Akses Ditolak.", "error"); }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in duration-500 font-bold uppercase">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 md:p-16 relative shadow-2xl border border-[#D4AF37]/20">
        <button onClick={onBack} className="absolute top-8 right-8 text-zinc-300 hover:text-black transition-all border-none bg-transparent cursor-pointer outline-none"><CloseIcon size={24} /></button>
        <div className="text-center mb-10 space-y-4">
          <div className="w-16 h-16 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto text-[#D4AF37]">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-serif font-bold uppercase leading-none">Security Portal</h3>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input placeholder="Admin ID" value={u} onChange={e=>setU(e.target.value)} className="w-full bg-zinc-50 p-4 rounded-xl border-none text-xs outline-none"/>
          <input type="password" placeholder="Pass-Key" value={p} onChange={e=>setP(e.target.value)} className="w-full bg-zinc-50 p-4 rounded-xl border-none text-xs outline-none"/>
          <button type="submit" disabled={loading} className="w-full bg-black text-[#D4AF37] py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl border-none cursor-pointer active:scale-95">
             {loading ? "VERIFYING..." : "AUTHORIZE"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CartView({ items, onRemove, onCheckout }) {
  const total = items.reduce((s, i) => s + Number(i.chosenPrice || i.price), 0);
  return (
    <div className="max-w-2xl mx-auto py-10 md:py-32 px-4 font-bold uppercase">
       <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-serif font-bold italic tracking-tighter uppercase text-zinc-950 leading-none">Shopping <span className="text-[#D4AF37]">Bag</span></h2>
          <div className="w-12 h-[2px] bg-[#D4AF37] mx-auto opacity-40"></div>
       </div>
       {items.length === 0 ? (
         <div className="text-center py-24 border-2 border-dashed border-zinc-100 rounded-3xl bg-white group transition-all duration-700">
            <BagIcon size={64} className="mx-auto text-zinc-50 mb-6 opacity-30" />
            <p className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest animate-pulse">Bag is empty</p>
         </div>
       ) : (
         <div className="space-y-6">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-white border border-zinc-100 rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                 <div className="flex items-center gap-4 flex-1">
                    <img src={item.imageURL} className="w-16 h-20 rounded-xl object-cover border border-zinc-50 shadow-sm"/>
                    <div className="space-y-1">
                       <h4 className="text-xs font-serif font-bold uppercase tracking-tight text-zinc-800 truncate max-w-[140px]">{String(item.name)}</h4>
                       <span className="text-[8px] font-bold px-3 py-1 bg-zinc-50 text-zinc-400 rounded-full border border-zinc-100 uppercase tracking-widest">Size {String(item.chosenSize || "Default")}</span>
                       <p className="text-xs font-serif font-bold italic text-zinc-900 leading-none">{formatIDR(item.chosenPrice || item.price)}</p>
                    </div>
                 </div>
                 <button onClick={()=>onRemove(idx)} className="p-3 text-red-100 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer active:scale-90 outline-none"><Trash2 size={18}/></button>
              </div>
            ))}
            <div className="pt-10 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="text-center md:text-left space-y-1">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Total Invoiced</p>
                  <p className="text-4xl md:text-6xl font-serif font-bold italic tracking-tighter text-zinc-950 leading-none">{formatIDR(total)}</p>
               </div>
               <button onClick={onCheckout} className="w-full md:w-auto bg-black text-[#D4AF37] px-12 py-5 rounded-full font-bold uppercase text-[11px] tracking-widest shadow-2xl border-none cursor-pointer hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-4 outline-none">
                 Checkout Sekarang <ArrowRight size={20} />
               </button>
            </div>
         </div>
       )}
    </div>
  );
}
