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
 * VERSION: 11.0.0 (MAISON MAGNUM CONCIERGE EDITION)
 * ARCHITECTURE: ENTERPRISE MONOLITHIC REACT CANVAS
 * ==========================================================================================
 */

// --- GLOBAL CONFIGURATION & STYLE TOKENS ---
const BRAND_PRIMARY = "#D4AF37"; // Signature Gold
const BRAND_DARK = "#050505";    // Obsidian Black

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
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', 'All Size'];
const BANK_LOGOS = {
  "BCA": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
  "BRI": "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_Logo.svg",
  "Mandiri": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
  "CIMB Niaga": "https://upload.wikimedia.org/wikipedia/commons/5/5e/CIMB_Niaga_logo.svg",
  "DANA": "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dan_automotive.png",
  "OVO": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg",
  "GoPay": "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg"
};

// --- INITIALIZE FIREBASE ---
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });
const storage = getStorage(firebaseApp);

// --- HELPER UTILITIES ---
const formatIDR = (amount) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val);
};

const callGeminiAI = async (prompt, systemInstruction = "") => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: String(prompt) }] }],
        systemInstruction: { parts: [{ text: String(systemInstruction) }] }
      })
    });
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "Maison AI sedang merancang gaya elegan untuk Anda.";
  } catch (err) {
    return "Pusat kecerdasan butik sedang mengalami gangguan teknis.";
  }
};

/**
 * ==========================================================================================
 * --- UTAMA: KOMPONEN APLIKASI ---
 * ==========================================================================================
 */
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

  // --- NOTIFICATION HANDLER ---
  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message: String(message), type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // --- AUTH & SETUP ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth System Error", err);
      } finally {
        setTimeout(() => setLoading(false), 2000);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // --- DATA SYNC ---
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
      const cat = String(p.category || '');
      const matchCat = categoryFilter === 'Semua' || cat === categoryFilter;
      const matchSearch = name.includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, categoryFilter, searchTerm]);

  if (loading) return <PremiumLoader />;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#111] font-sans antialiased overflow-x-hidden selection:bg-[#D4AF37] selection:text-white">
      
      {/* NOTIFICATION HUB */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[4000] flex flex-col gap-4 w-full max-w-md px-6 pointer-events-none font-bold uppercase">
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

      <div className="pt-20 md:pt-28">
        <main>
          {view === 'shop' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000">
              <HeroSection onExplore={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })} />
              <CraftsmanshipSection />
              
              <div id="catalog" className="bg-white/80 backdrop-blur-3xl border-b border-zinc-100 sticky top-20 md:top-28 z-40 overflow-x-auto no-scrollbar shadow-sm transition-all duration-500">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-start md:justify-center gap-8 whitespace-nowrap">
                  {CATEGORIES.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setCategoryFilter(c)} 
                      className={`text-[9px] md:text-[10px] uppercase font-bold tracking-[0.4em] transition-all px-8 py-3 rounded-full border-none cursor-pointer outline-none ${categoryFilter === c ? 'bg-black text-[#D4AF37] shadow-xl' : 'text-zinc-300 hover:text-black bg-transparent'}`}
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
                notify(`${String(p.name)} ditambahkan.`, "success");
              }}
            />
          )}

          {view === 'checkout' && selectedProduct && (
            <CheckoutView 
              product={selectedProduct} 
              rekening={rekening} 
              onComplete={() => { setView('shop'); }} 
              onBack={() => setView('shop')} 
            />
          )}

          {view === 'cart' && (
            <CartView 
              items={cart} 
              onRemove={(idx) => {
                const newCart = [...cart];
                newCart.splice(idx, 1);
                setCart(newCart);
                notify("Dilepaskan dari bag.");
              }} 
              onCheckout={() => {
                if (cart.length > 0) {
                  setSelectedProduct(cart[0]);
                  setView('checkout');
                }
              }}
            />
          )}

          {view === 'login' && <AdminLogin creds={adminCreds} onLoginSuccess={() => { setIsAdminLoggedIn(true); setView('admin'); }} onBack={() => setView('shop')} />}
          
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

      <PremiumNewsletter />
      <Footer setView={setView} />
    </div>
  );
}

/**
 * --- SUB-KOMPONEN: SHARED INTERFACE ---
 */

function PremiumLoader() {
  return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-10 px-8">
      <div className="relative">
        <div className="w-40 h-40 border border-[#D4AF37]/10 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="text-center">
             <h2 className="font-serif text-4xl text-[#D4AF37] italic tracking-[0.4em] animate-pulse font-bold uppercase">DEVI</h2>
             <p className="text-zinc-800 text-[8px] uppercase tracking-[1.4em] font-bold mt-4">Maison Luxe</p>
           </div>
        </div>
      </div>
      <p className="text-zinc-600 text-[9px] uppercase tracking-[1.5em] font-bold animate-pulse text-black uppercase">Establishing Link</p>
    </div>
  );
}

function Header({ cartCount, isAdmin, setView, setCategoryFilter, searchTerm, setSearchTerm }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-1000 ${scrolled ? 'h-16 md:h-20 bg-white/95 shadow-xl' : 'h-24 md:h-28 bg-white/70'} backdrop-blur-3xl border-b border-zinc-100`}>
      <div className="max-w-7xl mx-auto px-4 md:px-12 h-full flex items-center justify-between">
        
        <div className="flex-1 hidden lg:flex items-center gap-12 text-black font-bold uppercase">
          <button onClick={() => { setView('shop'); setCategoryFilter('Semua'); }} className="text-[10px] font-bold uppercase tracking-[0.5em] hover:text-[#D4AF37] transition-all relative group bg-transparent border-none cursor-pointer outline-none">
            COLLECTIONS
            <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-[#D4AF37] transition-all group-hover:w-full"></span>
          </button>
          <div className="relative group text-black font-bold uppercase">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
            <input 
              type="text" 
              placeholder="Find keanggunan..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="bg-zinc-50 border-none rounded-full pl-12 pr-8 py-3 text-[10px] w-52 focus:w-80 focus:bg-white focus:ring-1 focus:ring-zinc-100 transition-all outline-none font-medium placeholder:tracking-[0.4em]" 
            />
          </div>
        </div>

        <div className="flex-1 flex justify-center transform scale-90 md:scale-100 text-black font-bold uppercase">
          <div className="text-center cursor-pointer group" onClick={() => setView('shop')}>
            <h1 className="text-2xl md:text-3xl font-serif tracking-[0.6em] font-bold text-black uppercase leading-none transform group-hover:scale-105 transition-all duration-1000 select-none">
              DEVI<span className="text-[#D4AF37]">_OFFICIAL</span>
            </h1>
            <p className="text-[7px] uppercase tracking-[1.4em] text-zinc-400 mt-4 group-hover:text-[#D4AF37] transition-colors font-bold">PREMIUM MAISON</p>
          </div>
        </div>

        <div className="flex-1 flex justify-end gap-3 md:gap-10 items-center text-black font-bold uppercase">
           <button onClick={() => setView('cart')} className="relative p-3.5 hover:bg-zinc-50 rounded-full transition-all group bg-transparent border-none cursor-pointer outline-none">
             <BagIcon size={24} className="group-hover:translate-y-[-2px] transition-transform text-zinc-800" />
             {cartCount > 0 && <span className="absolute top-1.5 right-1.5 bg-[#D4AF37] text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-bounce shadow-lg">{cartCount}</span>}
           </button>
           
           <div className="flex items-center gap-4 text-black font-bold uppercase">
              <div className="hidden md:flex bg-zinc-50 px-5 py-2.5 rounded-full border border-zinc-100 items-center gap-3 shadow-inner group transition-all hover:bg-zinc-100">
                 <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_12px_rgba(212,175,55,1)]"></div>
                 <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-[0.3em]">{isAdmin ? "Admin" : "Guest"}</span>
              </div>
              {isAdmin ? (
                <button onClick={() => setView('admin')} className="p-4 bg-black text-white rounded-full hover:bg-[#D4AF37] hover:text-black transition-all shadow-2xl border-none cursor-pointer outline-none active:scale-90">
                  <LayoutDashboard size={22} />
                </button>
              ) : (
                <button onClick={() => setView('login')} className="p-4 bg-zinc-50 rounded-full hover:bg-black hover:text-white transition-all border-none cursor-pointer group outline-none active:scale-90">
                  <Key size={22} className="group-hover:rotate-45 transition-transform" />
                </button>
              )}
           </div>
        </div>
      </div>
    </header>
  );
}

/**
 * --- SUB-KOMPONEN: LANDING BLOCKS ---
 */

function HeroSection({ onExplore }) {
  return (
    <section className="relative h-[80vh] md:h-[110vh] flex items-center justify-center overflow-hidden bg-[#070707] text-white">
      <img src="https://images.unsplash.com/photo-1549439602-43ebcb232811?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105 animate-[pulse_25s_infinite]" alt="Hero" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-black/40 to-transparent"></div>
      
      <div className="relative z-10 text-center px-10 max-w-6xl space-y-16 text-white font-bold uppercase">
        <div className="space-y-8 animate-in slide-in-from-bottom-40 duration-1000">
           <div className="flex items-center justify-center gap-12">
              <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#D4AF37]/80"></div>
              <p className="text-[11px] uppercase tracking-[2.2em] font-bold text-[#D4AF37] drop-shadow-xl">Pure Excellence</p>
              <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#D4AF37]/80"></div>
           </div>
           <h2 className="text-5xl md:text-[12rem] font-serif italic tracking-tighter font-bold uppercase leading-[0.75] text-white drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]">Keanggunan <br/> <span className="text-[#D4AF37]">Abadi</span></h2>
        </div>
        <p className="text-zinc-300 text-[10px] md:text-2xl max-w-4xl mx-auto font-medium tracking-[0.25em] leading-relaxed uppercase italic opacity-80">
          Kurasi terbatas yang merayakan kemewahan dalam setiap helai material premium terpilih.
        </p>
        <button onClick={onExplore} className="mt-14 px-20 md:px-32 py-8 md:py-11 bg-[#D4AF37] text-black text-[12px] font-bold uppercase tracking-[1em] rounded-full hover:scale-105 hover:bg-white transition-all shadow-3xl border-none cursor-pointer active:scale-95 outline-none relative group overflow-hidden">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
          <span className="relative z-10">Mulai Belanja</span>
        </button>
      </div>
    </section>
  );
}

function CraftsmanshipSection() {
  return (
    <section className="bg-white py-40 border-y border-zinc-50 px-8 relative overflow-hidden text-black font-bold uppercase">
       <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[20rem] font-serif font-bold text-zinc-50 opacity-60 select-none pointer-events-none -ml-52 tracking-tighter italic text-black font-bold uppercase">MAGNUM</div>
       <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-24 relative z-10 text-black font-bold uppercase">
          {[
            { icon: <Scissors size={32} />, title: "Precision Cut", desc: "Setiap busana dikerjakan secara manual oleh penjahit master." },
            { icon: <Palette size={32} />, title: "Elite Textiles", desc: "Hanya menggunakan sutra dan brokat premium bersertifikat." },
            { icon: <Crown size={32} />, title: "Seal of Royalty", desc: "Sentuhan akhir elegan dengan detail kristal tangan." }
          ].map((item, idx) => (
            <div key={idx} className="space-y-8 text-center group hover:scale-105 transition-all duration-700 text-black font-bold uppercase">
               <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-sm text-[#D4AF37] group-hover:bg-black transition-all">
                  {item.icon}
               </div>
               <div className="space-y-4">
                  <h4 className="text-sm font-serif font-bold uppercase tracking-[0.3em] italic text-zinc-900">{item.title}</h4>
                  <p className="text-zinc-400 text-[10px] leading-relaxed max-w-xs mx-auto font-medium">{item.desc}</p>
               </div>
            </div>
          ))}
       </div>
    </section>
  );
}

function MembershipBanner() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-40 text-white font-bold uppercase">
       <div className="bg-[#0D0D0D] rounded-[4rem] md:rounded-[4.5rem] p-12 md:p-24 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-16 border border-white/5 shadow-3xl text-white font-bold uppercase">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px] -mr-48 -mt-48 opacity-30"></div>
          <div className="relative z-10 space-y-10 max-w-xl text-white text-center md:text-left">
             <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center text-[#D4AF37] mx-auto md:mx-0 mb-4 shadow-2xl border border-[#D4AF37]/20"><Verified size={32} /></div>
             <h2 className="text-4xl md:text-7xl font-serif font-bold italic tracking-tighter leading-tight uppercase text-white">Privilege <br/> <span className="text-[#D4AF37]">Membership</span></h2>
             <p className="text-zinc-500 font-medium leading-relaxed tracking-wide text-[11px] md:text-lg">Dapatkan akses eksklusif ke koleksi Maison yang belum dirilis publik.</p>
             <button className="px-12 py-6 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#D4AF37] transition-all border-none cursor-pointer outline-none active:scale-95 shadow-2xl">Bergabung Sekarang</button>
          </div>
          <div className="relative z-10 w-full md:w-[28rem] aspect-[3/4] rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white/5 group">
             <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1020&auto=format&fit=crop" className="w-full h-full object-cover transition-all duration-[10s] group-hover:scale-110 group-hover:rotate-2" alt="Promo" />
          </div>
       </div>
    </section>
  );
}

function TrendingSelection({ products, onView }) {
  return (
    <section className="py-40 bg-[#080808] text-white px-6 overflow-hidden border-t border-[#D4AF37]/10 text-white font-bold uppercase">
       <div className="max-w-7xl mx-auto space-y-28 relative text-white font-bold uppercase">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 text-white font-bold uppercase">
             <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center gap-5 justify-center md:justify-start"><TrendingUp className="text-[#D4AF37]" size={24} /><span className="text-[11px] font-bold uppercase tracking-[0.8em] text-[#D4AF37]">Seasonal Trends</span></div>
                <h2 className="text-5xl md:text-8xl font-serif font-bold italic tracking-tighter uppercase leading-none text-white font-bold uppercase">The <span className="text-[#D4AF37]">Vanguard</span></h2>
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10 text-white font-bold uppercase">
             {products.map(p => (
               <div key={p.id} onClick={() => onView(p)} className="group cursor-pointer space-y-10 text-white font-bold uppercase">
                  <div className="relative aspect-[3/4.6] rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 transition-all duration-1000 group-hover:translate-y-[-10px]">
                     <img src={p.imageURL} className="w-full h-full object-cover transition-all duration-[10s] group-hover:scale-110" alt=""/>
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center"><Eye size={24} className="text-[#D4AF37]" /></div>
                     </div>
                  </div>
                  <div className="text-center space-y-2 text-white font-bold uppercase">
                     <h4 className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-[#D4AF37] transition-colors">{String(p.name)}</h4>
                     <p className="text-xl font-serif font-bold italic text-white">{formatIDR(p.price)}</p>
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
    <section className="py-40 bg-white border-t border-zinc-50 px-8 relative overflow-hidden">
       <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-32 relative z-10 text-black font-bold uppercase">
          <div className="flex-1 space-y-16 order-2 lg:order-1 text-center lg:text-left">
             <div className="flex items-center gap-10 justify-center lg:justify-start"><div className="w-16 h-[1px] bg-[#D4AF37]"></div><span className="text-[12px] font-bold uppercase tracking-[1em] text-[#D4AF37]">Ethics</span></div>
             <h2 className="text-5xl md:text-[8rem] font-serif font-bold italic tracking-tighter uppercase leading-[0.82] text-zinc-950 text-black font-bold uppercase leading-none">Maison <span className="text-zinc-200">DNA</span></h2>
             <p className="text-zinc-500 text-[11px] md:text-xl leading-relaxed font-medium tracking-wide uppercase italic opacity-90 border-l-[4px] border-[#D4AF37]/20 pl-8 md:pl-16">Kemewahan abadi berawal dari tanggung jawab.</p>
             <button className="px-16 py-8 border-2 border-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-[0.6em] text-zinc-800 hover:bg-black hover:text-white transition-all duration-700 outline-none">Read Report</button>
          </div>
       </div>
    </section>
  );
}

/**
 * ==========================================================================================
 * --- SUB-KOMPONEN: PRODUK & DETAIL ---
 * ==========================================================================================
 */

function ProductGrid({ products, onView }) {
  if (!products || products.length === 0) return (
    <div className="py-40 text-center flex flex-col items-center gap-10 text-black font-bold uppercase">
      <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
      <p className="text-zinc-300 font-bold uppercase text-[12px] tracking-[1.2em]">Archiving Maison...</p>
    </div>
  );
  
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-20 text-black font-bold uppercase">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 md:gap-x-14 gap-y-24 md:gap-y-36 text-black font-bold uppercase">
        {products.map((p) => (
          <div key={p.id} className="group cursor-pointer flex flex-col items-center" onClick={() => onView(p)}>
            <div className="relative aspect-[3/4.8] w-full overflow-hidden rounded-[3.5rem] bg-zinc-50 shadow-sm group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-1000 group-hover:-translate-y-4">
              <img src={p.imageURL} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt={p.name} />
              <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 bg-black text-[#D4AF37] px-6 py-2 md:px-8 md:py-3 rounded-full text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                {String(p.category)}
              </div>
            </div>
            <div className="text-center mt-12 space-y-4 px-6 relative text-black font-bold uppercase leading-tight">
              <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                {[...Array(5)].map((_, i) => <Star key={i} size={11} className="fill-[#D4AF37] text-[#D4AF37]" />)}
              </div>
              <h3 className="text-[12px] md:text-[14px] font-medium tracking-[0.3em] text-zinc-400 uppercase line-clamp-1 group-hover:text-black transition-colors duration-700 font-serif italic">
                {String(p.name)}
              </h3>
              <p className="text-[20px] md:text-[24px] font-bold text-black font-serif tracking-tighter italic">
                {formatIDR(p.price)}
              </p>
              <div className="w-10 h-[1.5px] bg-zinc-50 mx-auto transition-all duration-1000 group-hover:w-28 group-hover:bg-[#D4AF37]/40"></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductDetailView({ product, onBack, onBuy, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [currentPrice, setCurrentPrice] = useState(Number(product.price));
  const [activeTab, setActiveTab] = useState('description');
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (selectedSize && product.sizePrices && product.sizePrices[selectedSize]) {
      setCurrentPrice(Number(product.sizePrices[selectedSize]));
    } else {
      setCurrentPrice(Number(product.price));
    }
  }, [selectedSize, product]);

  const handleAIStylist = async () => {
    setLoadingAi(true);
    const advice = await callGeminiAI(
      `Saran gaya butik mewah untuk "${product.name}" kategori "${product.category}".`,
      "Fashion Curator Devi Official."
    );
    setAiAdvice(String(advice));
    setLoadingAi(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-black animate-in slide-in-from-right duration-1000 text-black font-bold uppercase">
      
      <button onClick={onBack} className="flex items-center gap-4 text-zinc-400 mb-16 text-[10px] md:text-[12px] font-bold uppercase tracking-[0.5em] hover:text-black transition-all border-none bg-transparent cursor-pointer group outline-none">
        <div className="w-10 h-10 border border-zinc-100 rounded-full flex items-center justify-center group-hover:bg-zinc-50 transition-all">
          <ChevronLeft size={24} /> 
        </div>
        Kembali
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-40 items-start relative text-black font-bold uppercase">
        
        {/* Gallery - Static on Mobile to prevent overlap */}
        <div className="lg:sticky lg:top-40 space-y-10 order-1 w-full text-black font-bold uppercase">
          <div className="aspect-[4/6] bg-zinc-50 rounded-[3rem] md:rounded-[6rem] overflow-hidden shadow-2xl border border-zinc-100 relative group/img">
            <img src={product.imageURL} className="w-full h-full object-cover transition-transform duration-[12s] group-hover/img:scale-105" alt={product.name} />
          </div>
        </div>

        <div className="flex flex-col space-y-16 order-2 text-black font-bold uppercase">
          <div className="space-y-10 text-black font-bold uppercase">
            <div className="flex items-center gap-8">
               <p className="text-[#D4AF37] text-[11px] md:text-[12px] font-bold uppercase tracking-[1em] border-l-[8px] border-[#D4AF37] pl-8 leading-none py-1">
                 {String(product.category).toUpperCase()}
               </p>
               <div className="flex gap-2">
                 {[...Array(5)].map((_,i) => <Star key={i} size={15} className="fill-[#D4AF37] text-[#D4AF37]" />)}
               </div>
            </div>
            <h2 className="text-3xl md:text-7xl font-serif font-bold mb-10 uppercase tracking-tighter leading-tight text-zinc-900">{String(product.name)}</h2>
            <p className="text-4xl md:text-8xl font-bold text-black tracking-tighter font-serif italic">{formatIDR(currentPrice)}</p>
          </div>

          <div className="space-y-10 bg-zinc-50/70 p-10 md:p-20 rounded-[3rem] md:rounded-[6rem] border border-zinc-100 relative overflow-hidden text-black font-bold uppercase shadow-sm">
             <div className="flex gap-10 border-b border-zinc-100 pb-2 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('description')} className={`pb-8 text-[11px] font-bold uppercase tracking-[0.3em] relative border-none bg-transparent cursor-pointer whitespace-nowrap outline-none ${activeTab === 'description' ? 'text-black' : 'text-zinc-300'}`}>
                   Materials & Quality
                   {activeTab === 'description' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#D4AF37] animate-in zoom-in"></span>}
                </button>
             </div>
             
             <div className="min-h-[150px] animate-in fade-in duration-1000 relative text-black font-bold uppercase">
                <div className="relative text-black font-bold uppercase">
                   <div className="absolute left-0 top-0 w-[4px] h-full bg-gradient-to-b from-[#D4AF37] to-transparent rounded-full opacity-30"></div>
                   <p className="text-zinc-700 leading-[2.4] text-[15px] md:text-[22px] whitespace-pre-wrap font-medium italic pl-12 pr-6 font-serif uppercase">
                      {String(product.description || "Kemewahan yang dipersonalisasi. Setiap jahitan mencerminkan dedikasi butik kami.")}
                   </p>
                </div>
             </div>
          </div>

          <div className="space-y-14 text-black font-bold uppercase">
            <div>
               <h4 className="text-[12px] font-bold uppercase tracking-[0.6em] text-black flex items-center gap-6 mb-10 text-black font-bold uppercase">
                 <LayersIcon size={24} className="text-[#D4AF37]" /> Select Portfolio Size
               </h4>
               <div className="flex flex-wrap gap-5 text-black font-bold uppercase">
                  {(product.sizes || []).map(s => (
                    <div key={s} className="flex flex-col items-center gap-6 group/size text-black font-bold uppercase">
                      <button 
                        onClick={() => setSelectedSize(s)} 
                        className={`min-w-[75px] h-[75px] md:min-w-[85px] md:h-[85px] rounded-[3rem] flex items-center justify-center font-bold text-[14px] md:text-[16px] border-2 transition-all duration-1000 cursor-pointer outline-none ${selectedSize === s ? 'bg-black text-[#D4AF37] border-black scale-110 shadow-xl' : 'border-zinc-100 text-zinc-300 hover:border-zinc-500 bg-transparent'}`}
                      >
                        {String(s)}
                      </button>
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex flex-col gap-6 pt-10 text-black font-bold uppercase">
              <button 
                onClick={() => { if(!selectedSize) return alert("Pilih ukuran mewah Anda."); onBuy(selectedSize, currentPrice); }} 
                className="group w-full bg-black text-[#D4AF37] py-10 md:py-14 rounded-full text-[12px] md:text-[14px] font-bold uppercase tracking-[1em] shadow-[0_50px_100px_rgba(0,0,0,0.2)] hover:bg-[#151515] transition-all active:scale-95 border-none cursor-pointer flex items-center justify-center gap-8 outline-none"
              >
                PROCEED TO PAY <ArrowRight size={28} />
              </button>
              
              <button 
                onClick={() => { if(!selectedSize) return alert("Pilih ukuran terlebih dahulu!"); onAddToCart({...product, chosenSize: selectedSize, chosenPrice: currentPrice}); }}
                className="w-full bg-transparent border-2 border-zinc-100 py-8 md:py-12 rounded-full text-[11px] md:text-[12px] font-bold uppercase tracking-[0.6em] text-zinc-800 hover:border-black hover:bg-zinc-50 transition-all cursor-pointer outline-none active:scale-95"
              >
                Add to Bag
              </button>
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
  const [shipping, setShipping] = useState({ email: '', name: '', city: '', address: '', postalCode: '', phone: '', subscribe: true, dropship: false });
  const [payment, setPayment] = useState({ 
    invoice: `INV-DEVI-${Math.floor(Date.now() / 1000).toString().slice(-6)}`,
    paymentTime: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
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

  const downloadReceipt = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(15, 15, 15); doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(212, 175, 55); doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.text("DEVI OFFICIAL", 105, 32, { align: 'center' });
    const info = [["Invoice", payment.invoice], ["Client", shipping.name], ["Item", product.name], ["Size", product.chosenSize], ["Investment", formatIDR(payment.amount)]];
    let y = 95; info.forEach(r => { doc.setFont("helvetica", "bold"); doc.text(r[0] + ":", 35, y); doc.setFont("helvetica", "normal"); doc.text(String(r[1]), 105, y); y += 12; });
    doc.save(`Receipt_DEVI_${payment.invoice}.pdf`);
  };

  const submitFinalOrder = async () => {
    if (!payment.senderName || !payment.originBank || !shipping.name) return alert("Silakan lengkapi formulir.");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { 
        ...payment, shipping, productName: String(product.name), productSize: String(product.chosenSize), createdAt: serverTimestamp() 
      });
      setStep(4);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 text-black animate-in fade-in duration-700 font-bold uppercase">
       <div className="bg-white rounded-[3.5rem] shadow-3xl border border-zinc-100 overflow-hidden relative text-black font-bold uppercase">
          <button onClick={onBack} className="absolute top-8 right-8 p-3 hover:bg-zinc-50 rounded-full transition-all border-none bg-transparent cursor-pointer z-50 text-black"><X size={24} /></button>
          
          {step === 1 && (
            <div className="p-8 md:p-14 space-y-12 text-black font-bold uppercase">
               <h3 className="text-2xl font-serif font-bold italic border-b border-zinc-50 pb-6 text-black">Detail Pengiriman</h3>
               <div className="space-y-8 text-black font-bold uppercase">
                  <div className="group border-b-2 border-zinc-100 focus-within:border-[#D4AF37] transition-all pb-4 text-black font-bold uppercase">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-black">Nama Lengkap</label>
                    <input className="w-full py-4 text-sm font-bold border-none outline-none bg-transparent text-black" placeholder="Sherly Adelia" value={shipping.name} onChange={e=>setShipping({...shipping, name:e.target.value})}/>
                  </div>
                  <div className="group border-b-2 border-zinc-100 focus-within:border-[#D4AF37] transition-all pb-4 text-black font-bold uppercase">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-black font-bold uppercase">Email</label>
                    <input className="w-full py-4 text-sm font-bold border-none outline-none bg-transparent text-black" placeholder="client@devi.id" value={shipping.email} onChange={e=>setShipping({...shipping, email:e.target.value})}/>
                  </div>
                  <div className="group border-b-2 border-zinc-100 focus-within:border-[#D4AF37] transition-all pb-4 text-black font-bold uppercase">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-black font-bold uppercase">Alamat Lengkap</label>
                    <textarea className="w-full py-4 text-sm font-bold border-none outline-none bg-transparent h-24 resize-none text-black font-bold uppercase" placeholder="Jl. Kemang Raya..." value={shipping.address} onChange={e=>setShipping({...shipping, address:e.target.value})}/>
                  </div>
                  <div className="flex items-center gap-3">
                     <input type="checkbox" className="w-4 h-4 accent-[#D4AF37]" checked={shipping.dropship} onChange={()=>setShipping({...shipping, dropship: !shipping.dropship})}/>
                     <span className="text-[11px] text-zinc-500 font-medium">Kirim sebagai dropshipper</span>
                  </div>
               </div>
               <button onClick={()=>setStep(2)} className="w-full bg-[#3b82f6] text-white py-8 rounded-[3rem] font-bold text-[14px] uppercase tracking-[0.5em] shadow-2xl transition-all border-none cursor-pointer">Lanjutkan ke Pembayaran</button>
               
               <div className="pt-10 border-t border-zinc-100 space-y-6">
                  <div className="flex items-center gap-6">
                     <div className="relative">
                        <img src={product.imageURL} className="w-16 h-20 rounded-3xl object-cover border border-zinc-50 shadow-sm" alt=""/>
                        <span className="absolute -top-3 -right-3 bg-black text-[#D4AF37] text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold">1</span>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-xs font-bold text-zinc-800">{String(product.name)}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Size: {String(product.chosenSize)}</p>
                     </div>
                     <p className="text-xs font-bold">{formatIDR(product.chosenPrice || product.price)}</p>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold border-t border-zinc-50 pt-6">
                     <span className="text-zinc-400 text-sm">Total Invoiced</span> 
                     <span className="text-black font-bold font-serif italic">{formatIDR(product.chosenPrice || product.price)}</span>
                  </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-16 space-y-16 text-black font-bold uppercase">
               <div className="text-center space-y-2"><h3 className="text-2xl font-serif font-bold italic uppercase">Payment Method</h3><p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">Pilih rekening tujuan</p></div>
               <div className="grid grid-cols-1 gap-6">
                  {rekening.map(rek => (
                    <div key={rek.id} onClick={()=>{ setPayment({...payment, transferTo: `${rek.bankName} - ${rek.accountNumber} - ${rek.accountHolder}`}); setStep(3); }} className="p-10 border-2 border-zinc-50 rounded-3xl hover:border-[#D4AF37] cursor-pointer transition-all active:scale-95 group flex items-center justify-between shadow-sm text-black font-bold uppercase">
                       <div className="flex flex-col gap-4 text-black font-bold uppercase">
                          <img src={BANK_LOGOS[rek.bankName]} className="h-5 object-contain w-24 text-left grayscale group-hover:grayscale-0 transition-all duration-700" alt=""/>
                          <div className="space-y-1"><p className="text-xl font-mono font-bold text-black">{String(rek.accountNumber)}</p><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">A.N {String(rek.accountHolder)}</p></div>
                       </div>
                       <ArrowRight size={36} className="text-zinc-300 group-hover:text-black transition-all"/>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-12 md:p-16 space-y-12 text-black font-bold uppercase">
               <h3 className="text-center text-3xl font-serif font-bold italic border-b border-zinc-50 pb-6 text-black">Final Confirmation</h3>
               <div className="space-y-10 text-black font-bold uppercase">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-3 text-black">Ditransfer ke</label>
                    <div className="p-6 bg-zinc-900 rounded-[2.5rem] text-[12px] font-bold text-[#D4AF37] tracking-[0.4em] uppercase shadow-2xl border border-[#D4AF37]/30">{String(payment.transferTo)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-black font-bold uppercase">
                    <input className="w-full bg-zinc-50 border border-zinc-100 p-6 rounded-[2rem] text-sm font-bold outline-none text-black" placeholder="Bank Asal" value={payment.originBank} onChange={e=>setPayment({...payment, originBank:e.target.value})}/>
                    <input className="w-full bg-zinc-50 border border-zinc-100 p-6 rounded-[2rem] text-sm font-bold outline-none text-black" placeholder="Nama Pemilik" value={payment.senderName} onChange={e=>setPayment({...payment, senderName:e.target.value})}/>
                  </div>

                  <div onClick={()=>document.getElementById('uPf').click()} className="w-full aspect-[2/1] border-2 border-dashed border-[#D4AF37]/40 rounded-[4rem] bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-zinc-100 relative">
                    {payment.proofImage ? <img src={payment.proofImage} className="w-full h-full object-cover"/> : <div className="text-center"><Upload size={64} className="text-zinc-200 mx-auto" /><p className="text-xs uppercase mt-4 text-black">Upload Struk Digital</p></div>}
                    {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" size={48}/></div>}
                    <input type="file" id="uPf" className="hidden" accept="image/*" onChange={handleUpload}/>
                  </div>
               </div>
               <button onClick={submitFinalOrder} className="w-full bg-black text-[#D4AF37] py-10 rounded-[4rem] font-bold text-[14px] uppercase tracking-[1.5em] shadow-3xl transition-all border-none cursor-pointer">Konfirmasi Final</button>
               
               <div className="pt-10 border-t border-zinc-100 space-y-4">
                  {rekening.map(rek => (
                    <div key={rek.id} className="flex items-center gap-4 text-zinc-500">
                       <img src={BANK_LOGOS[rek.bankName]} className="h-4 object-contain grayscale opacity-50 w-12" alt=""/>
                       <div className="text-[9px] font-bold uppercase tracking-tight">
                          {String(rek.bankName)} <br/> {String(rek.accountNumber)} <br/> {String(rek.accountHolder)}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-28 text-center space-y-20 animate-in zoom-in duration-1000 text-black font-bold uppercase">
               <div className="w-48 h-48 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl border-[15px] border-white text-white font-bold uppercase"><SuccessIcon size={100}/></div>
               <div className="space-y-8 text-black font-bold uppercase">
                  <h3 className="text-6xl font-serif tracking-tighter">Order Received</h3>
                  <p className="text-[12px] text-zinc-400 tracking-[0.8em]">Terima kasih atas pesanan Anda.</p>
               </div>
               <div className="flex flex-col gap-6 pt-10">
                  <button onClick={downloadReceipt} className="flex items-center justify-center gap-6 bg-white border-2 border-zinc-100 p-8 rounded-[4rem] text-[13px] font-bold uppercase tracking-[0.6em] hover:bg-zinc-50 transition-all cursor-pointer border-none outline-none"><Download size={28} /> Receipt PDF</button>
                  <button onClick={onComplete} className="bg-black text-[#D4AF37] p-8 rounded-[4rem] text-[13px] font-bold uppercase shadow-2xl border-none outline-none">Home Koleksi</button>
               </div>
            </div>
          )}
       </div>
    </div>
  );
}

/**
 * ==========================================================================================
 * --- SUB-KOMPONEN: ADMIN DASHBOARD ---
 * ==========================================================================================
 */
function AdminDashboard({ products, orders, rekening, appId, onLogout, notify }) {
  const [tab, setTab] = useState('inventory');
  const [saving, setSaving] = useState(false);
  const [instaUrl, setInstaUrl] = useState('');
  const [formData, setFormData] = useState({ 
    imageURL: '', name: '', price: '', category: 'Baju', description: '', sizes: [], sizePrices: {} 
  });

  const publishProduct = async () => {
    if (!formData.name.trim() || !formData.price || !formData.imageURL || !formData.description.trim()) {
      return notify("Harap isi semua data Maison!", "error");
    }
    setSaving(true);
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), productData);
      setFormData({ imageURL: '', name: '', price: '', category: 'Baju', description: '', sizes: [], sizePrices: {} });
      setInstaUrl('');
      notify("Maha karya dipublikasikan.", "success");
    } catch (e) { notify("Error: " + e.message, "error"); } 
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-28 flex flex-col lg:flex-row gap-20 text-black font-bold uppercase">
      <aside className="lg:w-96 space-y-12">
         <div className="bg-zinc-950 p-14 rounded-[5rem] text-white shadow-3xl relative border border-white/5 overflow-hidden group text-white font-bold uppercase">
           <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/20 rounded-full blur-[100px] -mr-24 -mt-24 transition-all group-hover:scale-150 duration-[10s]"></div>
           <Crown className="text-[#D4AF37] mb-10 group-hover:rotate-12 transition-transform duration-700" size={64} />
           <p className="text-[11px] font-bold uppercase tracking-[1em] text-zinc-500 mb-2 text-white">Enterprise</p>
           <h2 className="text-4xl font-serif italic tracking-widest font-bold text-white">Maison Master</h2>
         </div>

         <div className="bg-white p-8 rounded-[4rem] border border-zinc-100 flex flex-col gap-4 shadow-sm font-bold uppercase text-black">
            {['inventory', 'orders', 'banking'].map(t => (
              <button key={t} onClick={()=>setTab(t)} className={`text-left px-12 py-7 rounded-[2rem] text-[13px] font-bold uppercase tracking-[0.6em] transition-all border-none cursor-pointer outline-none ${tab === t ? 'bg-black text-[#D4AF37] shadow-3xl translate-x-4' : 'text-zinc-300 hover:bg-zinc-50 bg-transparent'}`}>{t.toUpperCase()}</button>
            ))}
            <button onClick={onLogout} className="text-left px-12 py-7 rounded-[2rem] text-[13px] font-bold uppercase text-red-500 border-none bg-transparent cursor-pointer hover:bg-red-50 tracking-[0.5em] outline-none">Logout Maison</button>
         </div>
      </aside>

      <div className="flex-1 bg-white p-12 md:p-28 rounded-[7rem] border border-zinc-100 min-h-[95vh] shadow-sm relative overflow-hidden transition-all duration-1000 text-black font-bold uppercase">
         {tab === 'inventory' && (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-28 relative z-10 text-black font-bold uppercase">
              <div className="space-y-16">
                 <div className="aspect-[3/4.6] bg-zinc-50 rounded-[5rem] border-2 border-dashed border-zinc-100 overflow-hidden relative shadow-inner group">
                    {formData.imageURL ? (
                      <img src={formData.imageURL} className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-110"/>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
                        <Instagram size={100} />
                        <p className="text-[13px] font-bold uppercase tracking-[1.4em] mt-10 text-black">Awaiting Link</p>
                      </div>
                    )}
                 </div>

                 <div className="space-y-12 font-bold uppercase text-black">
                    <div className="flex gap-6 text-black">
                      <input className="flex-1 bg-zinc-50 p-8 rounded-[2.5rem] border-none text-[12px] font-bold uppercase outline-none shadow-inner text-black placeholder:text-zinc-300 focus:bg-white transition-all text-black" placeholder="Paste IG Link..." value={instaUrl} onChange={e=>setInstaUrl(e.target.value)}/>
                      <button onClick={()=>{ 
                        const clean = instaUrl.split('?')[0]; 
                        setFormData({...formData, imageURL: `https://images.weserv.nl/?url=${encodeURIComponent(clean.endsWith('/') ? clean + 'media/?size=l' : clean + '/media/?size=l')}&w=1200&output=jpg`});
                        notify("Visual Maha Karya Berhasil Ditarik."); 
                      }} className="bg-black text-[#D4AF37] px-14 rounded-[2.5rem] text-[12px] font-bold uppercase tracking-widest border-none cursor-pointer outline-none hover:bg-zinc-800 active:scale-95 shadow-2xl">Fetch</button>
                    </div>
                    
                    <input className="w-full bg-zinc-50 p-8 rounded-[2.5rem] border-none text-lg font-bold uppercase text-black shadow-inner outline-none focus:bg-white transition-all text-black" placeholder="Collection Title" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                    
                    <div className="grid grid-cols-2 gap-10 text-black font-bold uppercase">
                       <input type="number" className="w-full bg-zinc-50 p-8 rounded-[2.5rem] border-none text-lg font-bold text-black shadow-inner outline-none focus:bg-white transition-all text-black" placeholder="IDR" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                       <select className="w-full bg-zinc-50 p-8 rounded-[2.5rem] border-none text-[13px] font-bold uppercase text-black shadow-inner outline-none cursor-pointer bg-transparent appearance-none" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                          {CATEGORIES.map(c=><option key={c} value={c}>{String(c).toUpperCase()}</option>)}
                       </select>
                    </div>

                    <textarea className="w-full bg-zinc-50 p-16 rounded-[4rem] border-none text-lg font-medium leading-[2.2] italic text-black shadow-inner h-80 outline-none resize-none placeholder:text-zinc-200 transition-all focus:bg-white text-black" placeholder="Sebutkan jenis material..." value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/>
                    
                    <button onClick={publishProduct} disabled={saving} className="w-full bg-black text-[#D4AF37] py-11 rounded-[5rem] font-bold uppercase text-[15px] tracking-[1.2em] shadow-3xl disabled:opacity-50 border-none cursor-pointer active:scale-95 flex items-center justify-center gap-10 outline-none text-black font-bold uppercase">
                       {saving ? <Loader2 className="animate-spin" size={40} /> : <Zap size={36} />}
                       {saving ? "PRODUCING..." : "PUBLISH MAISON"}
                    </button>
                 </div>
              </div>
           </div>
         )}
         
         {tab === 'orders' && (
           <div className="space-y-16 animate-in fade-in duration-1000 text-black font-bold uppercase">
              <h3 className="text-center text-4xl font-serif">Maison Orders</h3>
              {orders.map(o => (
                <div key={o.id} className="p-12 bg-white border border-zinc-100 rounded-[4rem] flex justify-between items-center shadow-sm relative overflow-hidden">
                   <div className={`absolute left-0 top-0 w-2 h-full ${o.status === 'pending' ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
                   <div className="flex items-center gap-10">
                      <img src={o.proofImage} className="w-32 h-44 rounded-3xl object-cover shadow-2xl cursor-pointer" onClick={()=>window.open(o.proofImage, '_blank')}/>
                      <div className="space-y-4">
                         <span className="text-[10px] font-bold px-6 py-2 bg-zinc-50 rounded-full border border-zinc-100">{String(o.status).toUpperCase()}</span>
                         <h4 className="text-3xl font-serif">{String(o.senderName || o.shipping?.name)}</h4>
                         <p className="text-sm font-bold text-[#D4AF37] tracking-widest">{formatIDR(o.amount)}</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      {o.status === 'pending' && <button onClick={async()=>await updateDoc(doc(db,'artifacts',appId,'public','data', 'orders', o.id), {status:'confirmed'})} className="px-10 py-5 bg-black text-[#D4AF37] rounded-3xl text-[10px] font-bold uppercase shadow-2xl">Confirm</button>}
                      <button onClick={async()=>await deleteDoc(doc(db,'artifacts',appId,'public','data','orders',o.id))} className="p-6 text-red-200 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
}

function NewsletterSection() {
  return (
    <section className="bg-white py-60 px-10 border-t border-zinc-100 overflow-hidden relative text-black font-bold uppercase leading-tight">
       <div className="absolute top-0 right-0 w-[60rem] h-[60rem] bg-[#D4AF37]/5 rounded-full blur-[250px] -mr-80 -mt-80 opacity-50 animate-pulse"></div>
       <div className="max-w-6xl mx-auto text-center space-y-24 relative z-10 text-black font-bold uppercase">
          <div className="w-36 h-36 bg-zinc-50 rounded-[5rem] flex items-center justify-center mx-auto shadow-inner border border-[#D4AF37]/5 text-[#D4AF37] hover:scale-125 transition-transform duration-1000 hover:bg-black group cursor-pointer outline-none"><Mail size={64} /></div>
          <h2 className="text-7xl md:text-[10rem] font-serif font-bold italic tracking-tighter uppercase text-zinc-900 leading-none">Maison <span className="text-[#D4AF37]">Digest</span></h2>
          <div className="flex flex-col md:flex-row gap-10 max-w-4xl mx-auto items-center pt-10 text-black font-bold uppercase">
             <input className="flex-1 w-full bg-zinc-50/70 p-12 rounded-[4rem] border-2 border-zinc-100 text-xl font-bold shadow-inner outline-none text-black" placeholder="IDENTIFY E-MAIL..."/>
             <button className="w-full md:w-auto bg-black text-[#D4AF37] px-32 py-12 rounded-[4rem] font-bold uppercase text-[15px] tracking-[1em] shadow-3xl border-none cursor-pointer active:scale-95">AUTHENTICATE</button>
          </div>
       </div>
    </section>
  );
}

function PremiumNewsletter() {
  return <NewsletterSection />;
}

function NotificationItem({ notification }) {
  const { message, type } = notification;
  return (
    <div className={`p-8 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.2)] border-2 animate-in slide-in-from-top-20 duration-1000 backdrop-blur-[40px] flex items-center gap-10 pointer-events-auto group ${
      type === 'success' ? 'bg-green-50/95 border-green-200 text-green-950' : 
      type === 'error' ? 'bg-red-50/95 border-red-200 text-red-950' : 'bg-white/95 border-zinc-100 text-black font-bold uppercase'
    }`}>
      <div className={`p-6 rounded-[2rem] shadow-xl ${type === 'success' ? 'bg-green-400 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-black text-[#D4AF37]'}`}>
        {type === 'success' ? <SuccessIcon size={28} /> : type === 'error' ? <AlertCircle size={28} /> : <Bell size={28} />}
      </div>
      <p className="text-[16px] font-serif italic font-bold uppercase tracking-[0.2em] leading-relaxed">{String(message)}</p>
    </div>
  );
}

function Footer({ setView }) {
  return (
    <footer className="bg-[#030303] text-white pt-60 pb-32 px-14 relative overflow-hidden border-t-[6px] border-[#D4AF37]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60 shadow-[0_0_40px_rgba(212,175,55,0.8)]"></div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-40 relative z-10 text-white font-bold uppercase">
        <div className="col-span-1 md:col-span-2 space-y-24 text-white font-bold">
           <div className="space-y-12 text-white font-bold uppercase">
              <h2 className="text-7xl font-serif font-bold italic tracking-[0.4em] text-[#D4AF37] uppercase leading-none cursor-pointer" onClick={()=>setView('shop')}>DEVI OFFICIAL</h2>
              <p className="text-zinc-500 text-xl max-w-xl leading-[2.4] font-medium tracking-[0.3em] uppercase italic opacity-70 border-l-2 border-zinc-900 pl-14 shadow-inner text-white font-bold">Elevating modest fashion to a global standard of absolute luxury and sophistication.</p>
           </div>
           <div className="flex gap-20">
              {[<Instagram />, <Mail />, <Facebook />, <Globe />].map((icon, i) => (
                <div key={i} className="text-zinc-700 hover:text-[#D4AF37] cursor-pointer transition-all duration-1000 hover:scale-[1.8] transform hover:rotate-[15deg] text-white">
                  {React.cloneElement(icon, { size: 48 })}
                </div>
              ))}
           </div>
        </div>
        <div className="space-y-20 text-white font-bold">
           <h4 className="text-[16px] font-bold uppercase tracking-[1em] text-zinc-100 border-b border-zinc-900 pb-10 italic font-bold">Vault Security</h4>
           <div className="grid grid-cols-3 gap-14 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-[3s] text-white font-bold uppercase">
              {Object.values(BANK_LOGOS).slice(0,6).map((l, i) => <img key={i} src={l} className="h-10 object-contain drop-shadow-2xl" alt="Maison Bank" />)}
           </div>
        </div>
        <div className="space-y-20 text-white font-bold uppercase">
           <h4 className="text-[16px] font-bold uppercase tracking-[1em] text-zinc-100 border-b border-zinc-900 pb-10 italic font-bold">Maison Concierge</h4>
           <div className="space-y-16 text-[18px] text-zinc-500 font-medium tracking-[0.4em] uppercase font-bold text-white">
              <div className="flex items-center gap-8 text-white font-bold"><MapPin size={32} className="text-zinc-700" /> <span className="opacity-50">HQ: Jakarta Tower, ID</span></div>
              <div className="flex items-center gap-8 text-white font-bold"><Phone size={32} className="text-zinc-700" /> <span className="opacity-50">+62 812 9988 7766</span></div>
           </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-60 pt-24 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-20 text-white font-bold uppercase">
         <div className="text-zinc-800 text-[12px] uppercase tracking-[1.4em] font-bold italic opacity-40 text-white font-bold">© 2024 DEVI_OFFICIAL LUXURY GROUP. GLOBAL INTELLECTUAL PROPERTY PROTECTED.</div>
         <button onClick={() => setView('login')} className="flex items-center gap-8 text-zinc-700 text-[14px] font-bold tracking-[0.8em] hover:text-[#D4AF37] transition-all border border-zinc-900 px-24 py-10 rounded-full hover:border-[#D4AF37]/60 bg-transparent cursor-pointer uppercase shadow-inner group active:scale-95 text-white font-bold uppercase">
            <ShieldAlert size={28} className="group-hover:animate-bounce" /> <span>SECURE LOGIN</span>
         </button>
      </div>
    </footer>
  );
}

function AdminLogin({ creds, onLoginSuccess, onBack }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const inputU = u.trim().toLowerCase();
    const storedU = (creds?.username || 'admin').toLowerCase();
    await new Promise(r => setTimeout(r, 1200));
    if (inputU === storedU && p === (creds?.password || 'admin123')) {
      onLoginSuccess();
    } else {
      alert("Akses Ditolak: Kredensial Tidak Dikenali.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/98 backdrop-blur-[60px] animate-in zoom-in duration-700 text-black">
      <div className="bg-white w-full max-w-md rounded-[5rem] p-16 md:p-24 relative shadow-[0_100px_200px_rgba(0,0,0,0.6)] border border-[#D4AF37]/30 overflow-hidden">
        <button onClick={onBack} className="absolute top-12 right-12 text-zinc-300 hover:text-black transition-all border-none bg-transparent cursor-pointer outline-none group"><CloseIcon size={40} /></button>
        <div className="text-center mb-24 space-y-12">
          <div className="w-36 h-36 bg-zinc-50 rounded-[4.5rem] flex items-center justify-center mx-auto shadow-inner border border-[#D4AF37]/10 text-[#D4AF37] animate-pulse">
            <Lock size={64} />
          </div>
          <h3 className="text-4xl font-serif font-bold uppercase tracking-tighter leading-none text-black font-bold uppercase">Security Portal</h3>
        </div>
        <form onSubmit={handleLogin} className="space-y-12 text-black font-bold uppercase">
          <input placeholder="Admin ID" value={u} onChange={e=>setU(e.target.value)} className="w-full bg-zinc-50 p-9 rounded-[2.5rem] border-none text-black font-bold uppercase shadow-inner outline-none text-black"/>
          <input type="password" placeholder="Pass-Key" value={p} onChange={e=>setP(e.target.value)} className="w-full bg-zinc-50 p-9 rounded-[2.5rem] border-none text-black font-bold outline-none shadow-inner text-black"/>
          <button type="submit" disabled={loading} className="w-full bg-black text-[#D4AF37] py-10 rounded-[3rem] font-bold uppercase text-[13px] tracking-[0.8em] shadow-2xl hover:bg-[#D4AF37] hover:text-black transition-all active:scale-95 outline-none relative overflow-hidden text-black font-bold uppercase">
             {loading ? <Loader2 className="animate-spin mx-auto text-[#D4AF37]" /> : "Verify & Authorize"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CartView({ items, onRemove, onCheckout }) {
  const total = items.reduce((s, i) => s + Number(i.chosenPrice || i.price), 0);
  return (
    <div className="max-w-5xl mx-auto py-32 px-6 text-black animate-in slide-in-from-bottom duration-1000">
       <div className="text-center mb-28 space-y-8 text-black font-bold uppercase">
          <h2 className="text-6xl md:text-[9.5rem] font-serif font-bold italic tracking-tighter uppercase text-zinc-950 leading-none text-black font-bold uppercase">Shopping <span className="text-[#D4AF37]">Bag</span></h2>
          <div className="w-48 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto opacity-40 animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
       </div>
       {items.length === 0 ? (
         <div className="text-center py-52 border-2 border-dashed border-zinc-100 rounded-[5rem] bg-white group hover:border-[#D4AF37]/30 transition-all duration-1000 relative">
            <BagIcon size={140} className="mx-auto text-zinc-50 mb-12 group-hover:scale-110 transition-transform duration-1000 group-hover:text-[#D4AF37]/10" />
            <p className="text-zinc-300 font-bold uppercase text-[15px] tracking-[1.8em] animate-pulse text-black font-bold uppercase">Bag is currently empty</p>
         </div>
       ) : (
         <div className="space-y-16 text-black font-bold uppercase leading-tight">
            {items.map((item, idx) => (
              <div key={idx} className="p-12 bg-white border border-zinc-100 rounded-[4rem] flex flex-col md:flex-row items-center justify-between group hover:shadow-[0_80px_160px_rgba(0,0,0,0.08)] transition-all duration-1000 relative overflow-hidden border-none shadow-sm">
                 <div className="flex flex-col md:flex-row items-center gap-16 text-center md:text-left relative z-10 text-black font-bold uppercase">
                    <div className="relative group/img_wrap">
                      <div className="w-40 h-52 rounded-[3.5rem] overflow-hidden shadow-2xl relative border border-zinc-50">
                         <img src={item.imageURL} className="w-full h-full object-cover transition-transform duration-[8s] group-hover/img_wrap:scale-110"/>
                      </div>
                      <div className="absolute -top-5 -right-5 w-12 h-12 bg-black text-[#D4AF37] rounded-full flex items-center justify-center font-bold text-sm shadow-2xl border-[3px] border-white text-black font-bold uppercase">1</div>
                    </div>
                    <div className="space-y-5 text-black font-bold uppercase">
                       <h4 className="text-3xl font-serif font-bold uppercase tracking-tight text-zinc-800">{String(item.name)}</h4>
                       <div className="flex gap-6 items-center justify-center md:justify-start">
                          <span className="text-[11px] font-bold px-7 py-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full uppercase tracking-widest border border-[#D4AF37]/20 shadow-sm">Size {String(item.chosenSize || "Default")}</span>
                          <span className="text-base font-bold text-zinc-300 font-serif italic tracking-tighter">{formatIDR(item.chosenPrice || item.price)}</span>
                       </div>
                    </div>
                 </div>
                 <div className="mt-14 md:mt-0 flex items-center gap-16 text-black font-bold uppercase">
                    <p className="text-4xl font-serif font-bold italic tracking-tighter text-zinc-900">{formatIDR(item.chosenPrice || item.price)}</p>
                    <button onClick={()=>onRemove(idx)} className="p-8 text-zinc-100 hover:text-red-500 bg-zinc-50 rounded-[2.5rem] transition-all border-none bg-transparent cursor-pointer shadow-inner active:scale-90 outline-none"><Trash2 size={32}/></button>
                 </div>
              </div>
            ))}
            <div className="pt-24 border-t-2 border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-16 text-black font-bold uppercase leading-tight">
               <div className="text-center md:text-left space-y-4 text-black font-bold uppercase leading-tight">
                  <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-[0.8em]">Total Invoiced</p>
                  <p className="text-7xl md:text-[10rem] font-serif font-bold italic tracking-tighter text-zinc-950 leading-none">{formatIDR(total)}</p>
               </div>
               <button onClick={onCheckout} className="group w-full md:w-auto bg-black text-[#D4AF37] px-36 py-11 rounded-full font-bold uppercase text-[15px] tracking-[1em] shadow-[0_60px_120px_rgba(0,0,0,0.2)] border-none cursor-pointer hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-8 relative overflow-hidden outline-none text-black font-bold uppercase">
                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 Checkout <ArrowRight size={28} className="group-hover:translate-x-4 transition-transform duration-500" />
               </button>
            </div>
         </div>
       )}
    </div>
  );
}
