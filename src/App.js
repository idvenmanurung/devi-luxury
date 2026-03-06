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
  limit
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
  Check, 
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
  Briefcase,
  Clock,
  HeartPulse,
  Eye,
  Bookmark,
  Award,
  Crown,
  Menu,
  Scissors,
  Palette,
  Gift,
  RefreshCw,
  MousePointer2
} from 'lucide-react';

/**
 * --- CONFIGURATION FIREBASE ---
 */
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

/**
 * --- GEMINI AI INTEGRATION ---
 */
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
  } catch (err) { return "Koneksi AI terputus."; }
};

/**
 * --- CONSTANTS & HELPERS ---
 */
const BANK_LOGOS = {
  "BCA": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
  "BRI": "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_Logo.svg",
  "Mandiri": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
  "CIMB Niaga": "https://upload.wikimedia.org/wikipedia/commons/5/5e/CIMB_Niaga_logo.svg",
  "DANA": "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dan_automotive.png",
  "OVO": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg",
  "GoPay": "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg"
};

const CATEGORIES = ['Baju', 'Dress', 'Hijab', 'Abaya', 'Koko', 'Set Keluarga', 'Tas', 'Aksesoris'];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', 'All Size'];

const formatIDR = (amount) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

/**
 * --- MAIN APPLICATION COMPONENT ---
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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Authentication and initial script loading
  useEffect(() => {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Fail", err);
      } finally {
        setTimeout(() => setLoading(false), 2000);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Data synchronization from Firestore
  useEffect(() => {
    if (!user) return;
    const appIdData = appId;
    const pRef = collection(db, 'artifacts', appIdData, 'public', 'data', 'products');
    const rRef = collection(db, 'artifacts', appIdData, 'public', 'data', 'rekening');
    const oRef = collection(db, 'artifacts', appIdData, 'public', 'data', 'orders');
    const aRef = collection(db, 'artifacts', appIdData, 'public', 'data', 'admin_settings');

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

  // Premium loading screen
  if (loading) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-12 px-10">
      <div className="relative">
        <div className="w-40 h-40 border border-[#D4AF37]/10 rounded-full animate-[spin_8s_linear_infinite]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <h2 className="font-serif text-5xl text-[#D4AF37] italic tracking-[0.5em] animate-pulse select-none">DEVI</h2>
        </div>
      </div>
      <div className="text-center space-y-5 max-w-sm">
        <p className="text-zinc-600 text-[11px] uppercase tracking-[1em] font-bold">Establishing Premium Connection</p>
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-progress-line"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#121212] font-sans selection:bg-[#D4AF37] selection:text-white">
      {/* --- HEADER NAVIGATION --- */}
      <header className="sticky top-0 z-[100] bg-white/85 backdrop-blur-3xl border-b border-zinc-100 h-20 md:h-28 transition-all duration-700">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-full flex items-center justify-between">
          <div className="flex-1 hidden lg:flex items-center gap-14">
            <button onClick={() => { setView('shop'); setCategoryFilter('All'); }} className="text-[10px] font-bold uppercase tracking-[0.4em] hover:text-[#D4AF37] transition-all relative group bg-transparent border-none cursor-pointer">
              Collections
              <span className="absolute -bottom-2 left-0 w-0 h-[1.5px] bg-[#D4AF37] transition-all group-hover:w-full"></span>
            </button>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#D4AF37] transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Find Your Elegance..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="bg-zinc-50 border-none rounded-full pl-12 pr-8 py-3.5 text-[10px] w-52 focus:w-80 focus:bg-white focus:ring-1 focus:ring-zinc-100 transition-all outline-none font-medium placeholder:tracking-widest" 
              />
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="text-center cursor-pointer group" onClick={() => setView('shop')}>
              <h1 className="text-2xl md:text-4xl font-serif tracking-[0.5em] font-bold text-black uppercase leading-none transform group-hover:scale-105 transition-all duration-700">
                DEVI<span className="text-[#D4AF37]">_OFFICIAL</span>
              </h1>
              <p className="text-[8px] uppercase tracking-[1em] text-zinc-400 mt-2.5 group-hover:text-black transition-colors font-bold">Maison de Luxe</p>
            </div>
          </div>

          <div className="flex-1 flex justify-end gap-4 md:gap-10 items-center">
             <button onClick={() => setView('cart')} className="relative p-3.5 hover:bg-zinc-50 rounded-full transition-all group bg-transparent border-none cursor-pointer outline-none">
               <ShoppingBag size={24} className="group-hover:translate-y-[-2px] transition-transform text-zinc-800" />
               {cart.length > 0 && <span className="absolute top-1.5 right-1.5 bg-[#D4AF37] text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-bounce">{cart.length}</span>}
             </button>
             
             <div className="flex items-center gap-5">
                <div className="hidden md:flex bg-zinc-50 px-5 py-2.5 rounded-full border border-zinc-100 items-center gap-3 shadow-sm">
                   <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
                   <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-[0.3em]">{isAdminLoggedIn ? "Maison Admin" : "Guest Member"}</span>
                </div>
                {isAdminLoggedIn ? (
                  <button onClick={() => setView('admin')} className="p-4 bg-black text-white rounded-full hover:bg-[#D4AF37] hover:text-black transition-all shadow-2xl border-none cursor-pointer">
                    <LayoutDashboard size={20} />
                  </button>
                ) : (
                  <button onClick={() => setView('login')} className="p-4 bg-zinc-50 rounded-full hover:bg-black hover:text-white transition-all border-none cursor-pointer group">
                    <Key size={20} className="group-hover:rotate-12 transition-transform" />
                  </button>
                )}
             </div>
          </div>
        </div>
      </header>

      <main className="animate-in fade-in duration-1000">
        {view === 'shop' && (
          <>
            <HeroSection onExplore={() => window.scrollTo({top: 900, behavior: 'smooth'})} />
            
            <div className="bg-white/90 backdrop-blur-xl border-b border-zinc-100 sticky top-20 md:top-28 z-40 overflow-x-auto no-scrollbar shadow-sm">
              <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-start md:justify-center gap-12 whitespace-nowrap">
                <button onClick={() => setCategoryFilter('All')} className={`text-[11px] uppercase font-bold tracking-[0.5em] transition-all px-10 py-3.5 rounded-full border-none cursor-pointer ${categoryFilter === 'All' ? 'bg-black text-[#D4AF37] shadow-2xl scale-110' : 'text-zinc-300 hover:text-black bg-transparent'}`}>Semua</button>
                {CATEGORIES.map(c => <button key={c} onClick={() => setCategoryFilter(c)} className={`text-[11px] uppercase font-bold tracking-[0.5em] transition-all px-10 py-3.5 rounded-full border-none cursor-pointer ${categoryFilter === c ? 'bg-black text-[#D4AF37] shadow-2xl scale-110' : 'text-zinc-300 hover:text-black bg-transparent'}`}>{c}</button>)}
              </div>
            </div>

            <ProductGrid products={filteredProducts} onView={(p) => { setSelectedProduct(p); setView('detail'); window.scrollTo(0,0); }} />
            
            <CraftsmanshipSection />
            <FeaturedBanner />
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
          <AdminDashboard products={products} orders={orders} rekening={rekening} appId={appId} onLogout={() => { setIsAdminLoggedIn(false); setView('shop'); }} />
        )}

        {view === 'cart' && (
          <CartView 
            items={cart} 
            onRemove={(idx) => { const c = [...cart]; c.splice(idx,1); setCart(c); }} 
            onCheckout={() => { if(cart.length > 0) { setSelectedProduct(cart[0]); setView('checkout'); } }} 
          />
        )}
      </main>

      <NewsletterSection />
      <Footer setView={setView} />
    </div>
  );
}

/**
 * --- COMPONENT: HERO SECTION ---
 */
function HeroSection({ onExplore }) {
  return (
    <section className="relative h-[85vh] md:h-[110vh] flex items-center justify-center overflow-hidden bg-black text-white">
      <img src="https://images.unsplash.com/photo-1549439602-43ebcb232811?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 scale-100 animate-[pulse_12s_infinite]" alt="Hero" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      <div className="relative z-10 text-center px-6 max-w-5xl space-y-14">
        <div className="space-y-6 animate-in slide-in-from-bottom-32 duration-1000">
           <div className="flex items-center justify-center gap-8">
              <div className="h-[1px] w-20 bg-[#D4AF37]/60"></div>
              <p className="text-[12px] uppercase tracking-[1.8em] font-bold text-[#D4AF37] drop-shadow-lg">Exquisite Luxury</p>
              <div className="h-[1px] w-20 bg-[#D4AF37]/60"></div>
           </div>
           <h2 className="text-6xl md:text-[12rem] font-serif italic tracking-tighter font-bold uppercase leading-[0.8] text-white drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]">Keanggunan <br/> <span className="text-[#D4AF37]">Abadi</span></h2>
        </div>
        <p className="text-zinc-400 text-sm md:text-2xl max-w-3xl mx-auto font-medium tracking-widest leading-relaxed opacity-0 animate-[fade-in_1s_ease-out_forwards_delay-800ms]">
          Mengkurasi koleksi terbatas yang merayakan kemewahan dalam setiap helai material premium yang kami rancang khusus untuk Anda.
        </p>
        <button onClick={onExplore} className="mt-14 px-28 py-9 bg-[#D4AF37] text-black text-[13px] font-bold uppercase tracking-[0.8em] rounded-full hover:scale-105 hover:bg-white transition-all shadow-[0_40px_80px_rgba(212,175,55,0.25)] border-none cursor-pointer active:scale-95">
          Eksplorasi Koleksi
        </button>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce opacity-40">
         <div className="w-[1px] h-20 bg-[#D4AF37]"></div>
         <span className="text-[9px] uppercase tracking-[0.5em] font-bold">Scroll</span>
      </div>
    </section>
  );
}

/**
 * --- COMPONENT: CRAFTSMANSHIP (DEDICATED SECTION) ---
 */
function CraftsmanshipSection() {
  return (
    <section className="bg-zinc-50 py-40 border-y border-zinc-100 px-6">
       <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20">
          <div className="space-y-6 text-center group">
             <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl text-[#D4AF37] group-hover:scale-110 transition-transform"><Scissors size={32} /></div>
             <h4 className="text-sm font-serif font-bold uppercase tracking-widest italic">Artisanal Tailoring</h4>
             <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">Setiap busana dikerjakan secara presisi oleh penjahit ahli dengan standar kualitas butik kelas dunia.</p>
          </div>
          <div className="space-y-6 text-center group">
             <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl text-[#D4AF37] group-hover:scale-110 transition-transform"><Palette size={32} /></div>
             <h4 className="text-sm font-serif font-bold uppercase tracking-widest italic">Fine Materials</h4>
             <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">Hanya menggunakan sutra, brokat, dan katun premium terpilih yang memberikan kenyamanan serta kemewahan nyata.</p>
          </div>
          <div className="space-y-6 text-center group">
             <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl text-[#D4AF37] group-hover:scale-110 transition-transform"><Gift size={32} /></div>
             <h4 className="text-sm font-serif font-bold uppercase tracking-widest italic">Signature Design</h4>
             <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">Koleksi eksklusif dengan motif dan potongan yang tidak ditemukan di butik lain, menjamin keunikan Anda.</p>
          </div>
       </div>
    </section>
  );
}

/**
 * --- COMPONENT: FEATURED BANNER ---
 */
function FeaturedBanner() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-40">
       <div className="bg-[#0D0D0D] rounded-[4.5rem] p-12 md:p-24 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-16 border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
          <div className="relative z-10 space-y-10 max-w-xl text-white">
             <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-4"><Verified size={32} /></div>
             <h2 className="text-4xl md:text-6xl font-serif font-bold italic tracking-tighter leading-tight uppercase">Premium <br/> Member <span className="text-[#D4AF37]">Privilege</span></h2>
             <p className="text-zinc-500 font-medium leading-relaxed tracking-wide text-lg">Dapatkan akses eksklusif ke koleksi yang belum dirilis dan undangan pribadi ke peluncuran koleksi Devi Official selanjutnya.</p>
             <button className="px-12 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#D4AF37] transition-all border-none cursor-pointer active:scale-95">Bergabung Sekarang</button>
          </div>
          <div className="relative z-10 w-full md:w-80 aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group">
             <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1020&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110" alt="Promo" />
          </div>
       </div>
    </section>
  );
}

/**
 * --- COMPONENT: PRODUCT GRID ---
 */
function ProductGrid({ products, onView }) {
  if (!products || products.length === 0) return (
    <div className="py-60 text-center flex flex-col items-center gap-10 text-black">
      <div className="relative">
        <div className="w-40 h-40 border-2 border-zinc-100 rounded-full flex items-center justify-center">
           <ShoppingBasket className="text-zinc-100" size={80} />
        </div>
        <Loader2 className="animate-spin text-[#D4AF37] absolute -bottom-4 -right-4" size={48} />
      </div>
      <p className="text-zinc-300 font-bold uppercase text-[12px] tracking-[0.8em]">Mengkurasi Koleksi Masterpiece...</p>
    </div>
  );
  
  return (
    <section className="max-w-7xl mx-auto px-6 py-40">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-14 gap-y-32">
        {products.map((p) => (
          <div key={p.id} className="group cursor-pointer flex flex-col items-center" onClick={() => onView(p)}>
            <div className="relative aspect-[3/4.8] w-full overflow-hidden rounded-[4rem] bg-zinc-50 shadow-sm group-hover:shadow-[0_50px_100px_rgba(0,0,0,0.08)] transition-all duration-1000">
              <img src={p.imageURL} className="w-full h-full object-cover transition-transform duration-[8s] group-hover:scale-110" alt={p.name} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
              <div className="absolute top-8 left-8 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-[-20px] group-hover:translate-x-0">
                 <div className="p-4 bg-white/95 backdrop-blur-md rounded-full shadow-2xl hover:scale-110 transition-all"><Heart size={16} className="text-red-400" /></div>
                 <div className="p-4 bg-white/95 backdrop-blur-md rounded-full shadow-2xl hover:scale-110 transition-all"><Share2 size={16} /></div>
              </div>
              <div className="absolute bottom-8 right-8 bg-black text-[#D4AF37] px-8 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-2xl border border-[#D4AF37]/20">
                {String(p.category)}
              </div>
            </div>
            <div className="text-center mt-14 space-y-5 px-6">
              <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-[#D4AF37] text-[#D4AF37]" />)}
              </div>
              <h3 className="text-[15px] font-medium tracking-[0.5em] text-zinc-400 uppercase line-clamp-1 group-hover:text-black transition-colors duration-700">
                {String(p.name)}
              </h3>
              <p className="text-[26px] font-bold text-black font-serif tracking-tighter italic">
                {formatIDR(p.price)}
              </p>
              <div className="w-12 h-[1px] bg-zinc-100 mx-auto transition-all duration-700 group-hover:w-28 group-hover:bg-[#D4AF37]"></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * --- COMPONENT: PRODUCT DETAIL VIEW ---
 */
function ProductDetailView({ product, onBack, onBuy }) {
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
    const advice = await callGemini(
      `Saran gaya premium untuk "${product.name}" kategori "${product.category}". Deskripsi: "${product.description}".`,
      "Anda Fashion Expert di Devi Official."
    );
    setAiAdvice(String(advice));
    setLoadingAi(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-24 text-black animate-in slide-in-from-right duration-1000">
      <button onClick={onBack} className="flex items-center gap-4 text-zinc-400 mb-20 text-[12px] font-bold uppercase tracking-[0.6em] hover:text-black transition-all border-none bg-transparent cursor-pointer group outline-none">
        <div className="w-14 h-14 border border-zinc-100 rounded-full flex items-center justify-center group-hover:bg-zinc-50 group-hover:border-zinc-300 transition-all">
          <ChevronLeft size={28} /> 
        </div>
        Kembali ke Katalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 md:gap-32 items-start relative">
        {/* Gambar Produk - Sticky only on desktop */}
        <div className="lg:sticky lg:top-32 space-y-10 order-1">
          <div className="aspect-[4/6] bg-zinc-50 rounded-[4rem] md:rounded-[5rem] overflow-hidden shadow-2xl border border-zinc-100 relative group">
            <img src={product.imageURL} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105" alt={product.name} />
            <div className="absolute top-12 right-12 bg-white/95 p-6 rounded-[2rem] shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity translate-y-10 group-hover:translate-y-0 transition-transform duration-700">
               <Heart size={28} className="text-red-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Info detail (Fixed layout agar tidak tertutup di mobile) */}
        <div className="flex flex-col space-y-16 order-2">
          <div className="space-y-10">
            <div className="flex items-center gap-8">
               <p className="text-[#D4AF37] text-[13px] font-bold uppercase tracking-[1.2em] border-l-[6px] border-[#D4AF37] pl-10 leading-none">
                 {String(product.category)}
               </p>
               <div className="flex gap-2">
                 {[...Array(5)].map((_,i) => <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" />)}
               </div>
            </div>
            <h2 className="text-5xl md:text-[6.5rem] font-serif font-bold mb-10 uppercase tracking-tighter leading-[0.8] text-zinc-900 drop-shadow-sm">{String(product.name)}</h2>
            <div className="flex items-baseline gap-8">
               <p className="text-6xl md:text-7xl font-bold text-black tracking-tighter font-serif italic transition-all duration-700">{formatIDR(currentPrice)}</p>
               <span className="text-zinc-200 line-through text-2xl font-medium tracking-tight opacity-40">{formatIDR(currentPrice * 1.3)}</span>
            </div>
          </div>

          {/* TAB DESKRIPSI (Materials & Description) */}
          <div className="space-y-12 bg-zinc-50/70 p-10 md:p-14 rounded-[3rem] md:rounded-[5rem] border border-zinc-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-60 h-60 bg-white rounded-full blur-[100px] -mr-32 -mt-32 opacity-60 transition-all group-hover:scale-110"></div>
             
             <div className="flex gap-10 md:gap-16 border-b border-zinc-100 relative z-10 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('description')} className={`pb-6 text-[12px] font-bold uppercase tracking-[0.4em] transition-all relative border-none bg-transparent cursor-pointer whitespace-nowrap outline-none ${activeTab === 'description' ? 'text-black' : 'text-zinc-300'}`}>
                   Materials & Quality
                   {activeTab === 'description' && <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#D4AF37] animate-in zoom-in duration-500"></span>}
                </button>
                <button onClick={() => setActiveTab('shipping')} className={`pb-6 text-[12px] font-bold uppercase tracking-[0.4em] transition-all relative border-none bg-transparent cursor-pointer whitespace-nowrap outline-none ${activeTab === 'shipping' ? 'text-black' : 'text-zinc-300'}`}>
                   Concierge Delivery
                   {activeTab === 'shipping' && <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#D4AF37] animate-in zoom-in duration-500"></span>}
                </button>
             </div>
             
             <div className="min-h-[160px] animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-10">
                {activeTab === 'description' ? (
                  <div className="space-y-10 text-black">
                    <div className="flex items-center gap-5 text-[#D4AF37]">
                       <div className="p-3 bg-[#D4AF37]/10 rounded-2xl shadow-inner"><Crown size={24} /></div>
                       <span className="text-[12px] font-bold uppercase tracking-[0.5em]">Luxury Craftsmanship</span>
                    </div>
                    {/* DESKRIPSI PRODUK (MUNCUL CANTIK DI SINI) */}
                    <p className="text-zinc-600 leading-[2.2] text-[16px] whitespace-pre-wrap font-medium italic border-l-[3px] border-[#D4AF37]/20 pl-8 shadow-sm py-6 bg-white/30 rounded-r-3xl">
                       {String(product.description || "Kemewahan sejati dalam setiap detail. Kami menggunakan standar pengerjaan butik tertinggi untuk memastikan keanggunan maksimal bagi pemakainya.")}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-zinc-100">
                       <div className="flex items-center gap-5 text-[12px] font-bold text-black"><div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center"><Check size={14} className="text-[#D4AF37]" /></div> High-End Textiles</div>
                       <div className="flex items-center gap-5 text-[12px] font-bold text-black"><div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center"><Check size={14} className="text-[#D4AF37]" /></div> Precise Tailoring</div>
                       <div className="flex items-center gap-5 text-[12px] font-bold text-black"><div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center"><Check size={14} className="text-[#D4AF37]" /></div> Limited Piece</div>
                       <div className="flex items-center gap-5 text-[12px] font-bold text-black"><div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center"><Check size={14} className="text-[#D4AF37]" /></div> Exclusive Silhouette</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 text-zinc-500 text-[12px] font-bold leading-relaxed uppercase tracking-[0.4em]">
                     <div className="flex justify-between items-center bg-white p-7 rounded-3xl border border-zinc-50 shadow-sm"><span>Jakarta Metropolitan</span> <span className="text-black">1-2 Business Days</span></div>
                     <div className="flex justify-between items-center bg-white p-7 rounded-3xl border border-zinc-50 shadow-sm"><span>Java Island</span> <span className="text-black">3-4 Business Days</span></div>
                     <div className="flex justify-between items-center bg-white p-7 rounded-3xl border border-zinc-50 shadow-sm"><span>Across Indonesia</span> <span className="text-black">5-7 Business Days</span></div>
                  </div>
                )}
             </div>
          </div>

          {/* SIZE SELECTION & BUY BUTTON */}
          <div className="space-y-16">
            <div>
               <div className="flex justify-between items-center mb-10">
                  <h4 className="text-[12px] font-bold uppercase tracking-[0.6em] text-black flex items-center gap-5">
                    <Layers size={22} className="text-[#D4AF37]" /> Select Your Fit
                  </h4>
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest cursor-pointer hover:text-[#D4AF37] transition-colors flex items-center gap-2">
                    Size Concierge <Info size={14} />
                  </span>
               </div>
               <div className="flex flex-wrap gap-5">
                  {(product.sizes || []).map(s => (
                    <div key={s} className="flex flex-col items-center gap-4 group/size">
                      <button 
                        onClick={() => setSelectedSize(s)} 
                        className={`min-w-[85px] h-[85px] rounded-[2.5rem] flex items-center justify-center font-bold text-[16px] border-2 transition-all duration-500 cursor-pointer outline-none ${selectedSize === s ? 'bg-black text-[#D4AF37] border-black scale-110 shadow-[0_30px_60px_rgba(0,0,0,0.25)]' : 'border-zinc-100 text-zinc-300 hover:border-zinc-400 bg-transparent'}`}
                      >
                        {String(s)}
                      </button>
                      {product.sizePrices?.[s] && (
                        <span className={`text-[11px] font-bold font-serif transition-all duration-500 ${selectedSize === s ? 'text-[#D4AF37] scale-110' : 'text-zinc-200'}`}>
                          {formatIDR(product.sizePrices[s])}
                        </span>
                      )}
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex flex-col gap-10 pt-10">
              <button 
                onClick={() => { if(!selectedSize) return alert("Harap pilih ukuran mewah Anda sebelum melanjutkan."); onBuy(selectedSize, currentPrice); }} 
                className="group w-full bg-black text-[#D4AF37] py-11 rounded-[4rem] text-[15px] font-bold uppercase tracking-[0.8em] shadow-[0_50px_100px_rgba(0,0,0,0.2)] hover:bg-zinc-900 transition-all active:scale-95 border-none cursor-pointer flex items-center justify-center gap-8 outline-none"
              >
                Lanjutkan Pembayaran <ArrowRight size={26} className="group-hover:translate-x-3 transition-transform duration-500" />
              </button>
              
              <div className="flex justify-center gap-10 md:gap-16 border-t border-zinc-100 pt-12">
                 <div className="flex flex-col items-center gap-4 text-black"><div className="p-4 bg-zinc-50 rounded-2xl text-zinc-400"><Truck size={24} /></div><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Concierge</span></div>
                 <div className="flex flex-col items-center gap-4 text-black"><div className="p-4 bg-zinc-50 rounded-2xl text-zinc-400"><Verified size={24} /></div><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Authentic</span></div>
                 <div className="flex flex-col items-center gap-4 text-black"><div className="p-4 bg-zinc-50 rounded-2xl text-zinc-400"><ShieldCheck size={24} /></div><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Protected</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * --- COMPONENT: CHECKOUT VIEW (DIPERBAIKI PERSIS FOTO) ---
 */
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
    if (file.size > 2 * 1024 * 1024) alert("Sistem mendeteksi file besar. Gunakan screenshot struk agar upload instan!");
    setUploading(true);
    try {
      const storageRef = ref(storage, `artifacts/${appId}/public/data/proofs/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      setPayment(prev => ({ ...prev, proofImage: url }));
      alert("Bukti Transfer Terverifikasi.");
    } catch (err) { alert("Unggah Gagal: " + err.message); }
    finally { setUploading(false); }
  };

  const downloadReceipt = () => {
    if (!window.jspdf) return alert("Sistem struk sedang dimuat...");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(15, 15, 15); doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(212, 175, 55); doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.text("DEVI OFFICIAL", 105, 32, { align: 'center' });
    doc.setTextColor(50, 50, 50); doc.setFontSize(10); doc.text("BOUTIQUE SALES RECEIPT", 105, 68, { align: 'center' });
    doc.setDrawColor(212, 175, 55); doc.line(30, 75, 180, 75);
    const info = [["Invoice Reference", payment.invoice], ["Purchase Date", payment.paymentTime], ["Recipient Client", shipping.name], ["Item Collection", product.name], ["Size Selection", product.chosenSize], ["Payment Total", formatIDR(payment.amount)]];
    let y = 95; info.forEach(r => { doc.setFont("helvetica", "bold"); doc.text(r[0] + ":", 35, y); doc.setFont("helvetica", "normal"); doc.text(String(r[1]), 105, y); y += 12; });
    doc.save(`DEVI_LUXURY_${payment.invoice}.pdf`);
  };

  const submitOrder = async () => {
    if (!payment.senderName || !payment.originBank || !shipping.name) return alert("Silakan lengkapi formulir konfirmasi.");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { 
        ...payment, shipping, productName: String(product.name), productSize: String(product.chosenSize), createdAt: serverTimestamp() 
      });
      setStep(4);
    } catch (e) { alert("Network Error: " + e.message); }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-black animate-in fade-in duration-700">
       <div className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden relative">
          
          {/* STEP 1: INFORMASI PEMBELI & ALAMAT (PERSIS FOTO) */}
          {step === 1 && (
            <div className="p-8 md:p-10 space-y-8">
               <div className="flex items-center gap-3 text-[11px] text-zinc-300 font-bold uppercase tracking-widest mb-4">
                  <span className="text-black">Informasi Pembeli</span> <ChevronRight size={10}/> <span>Metode Pengiriman</span> <ChevronRight size={10}/> <span>Metode Pembayaran</span>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Email</label>
                    <input className="w-full border border-zinc-200 p-4 rounded-xl text-sm focus:border-blue-400 outline-none" placeholder="email@contoh.com" value={shipping.email} onChange={e=>setShipping({...shipping, email:e.target.value})}/>
                    <div className="flex items-center gap-3 mt-2">
                       <input type="checkbox" className="w-4 h-4" checked={shipping.subscribe} onChange={()=>setShipping({...shipping, subscribe: !shipping.subscribe})}/>
                       <span className="text-[11px] text-zinc-500 font-medium">Berlangganan ke newsletter</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold pt-4">Alamat Pengiriman</h3>
                  <div className="space-y-4">
                    <input className="w-full border border-zinc-200 p-4 rounded-xl text-sm outline-none focus:border-blue-400" placeholder="Nama" value={shipping.name} onChange={e=>setShipping({...shipping, name:e.target.value})}/>
                    <input className="w-full border border-zinc-200 p-4 rounded-xl text-sm outline-none focus:border-blue-400" placeholder="Kota/Kabupaten" value={shipping.city} onChange={e=>setShipping({...shipping, city:e.target.value})}/>
                    <textarea className="w-full border border-zinc-200 p-4 rounded-xl text-sm h-28 outline-none focus:border-blue-400" placeholder="Alamat" value={shipping.address} onChange={e=>setShipping({...shipping, address:e.target.value})}/>
                    <div className="grid grid-cols-2 gap-4">
                       <input className="border border-zinc-200 p-4 rounded-xl text-sm outline-none focus:border-blue-400" placeholder="Kode Pos" value={shipping.postalCode} onChange={e=>setShipping({...shipping, postalCode:e.target.value})}/>
                       <input className="border border-zinc-200 p-4 rounded-xl text-sm outline-none focus:border-blue-400" placeholder="Telepon" value={shipping.phone} onChange={e=>setShipping({...shipping, phone:e.target.value})}/>
                    </div>
                    <div className="flex items-center gap-3">
                       <input type="checkbox" className="w-4 h-4" checked={shipping.dropship} onChange={()=>setShipping({...shipping, dropship: !shipping.dropship})}/>
                       <span className="text-[11px] text-zinc-500 font-medium">Kirim sebagai dropshipper</span>
                    </div>
                  </div>
               </div>

               <button onClick={()=>setStep(2)} className="w-full bg-[#3b82f6] text-white py-6 rounded-xl font-bold text-sm shadow-xl hover:bg-blue-600 transition-all border-none cursor-pointer">Lanjutkan</button>

               {/* PRODUCT SUMMARY (PERSIS FOTO) */}
               <div className="pt-10 border-t border-zinc-100 space-y-6">
                  <div className="flex items-center gap-5">
                     <div className="relative">
                        <img src={product.imageURL} className="w-16 h-20 rounded-xl object-cover border border-zinc-50 shadow-sm" alt=""/>
                        <span className="absolute -top-3 -right-3 bg-zinc-400 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold">1</span>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-xs font-bold text-zinc-800">{String(product.name)}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Size: {String(product.chosenSize)}</p>
                     </div>
                     <p className="text-xs font-bold">{formatIDR(product.chosenPrice || product.price)}</p>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold border-t border-zinc-50 pt-6">
                     <span className="text-zinc-400 text-sm">Total</span> 
                     <span className="text-black font-bold">Rp {Number(product.chosenPrice || product.price).toLocaleString('id-ID')}</span>
                  </div>
               </div>
            </div>
          )}

          {/* STEP 2: METODE PEMBAYARAN */}
          {step === 2 && (
            <div className="p-10 space-y-12">
               <div className="text-center space-y-2"><h3 className="text-2xl font-serif font-bold italic uppercase">Payment Method</h3><p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Pilih rekening tujuan</p></div>
               <div className="grid grid-cols-1 gap-5">
                  {rekening.map(rek => (
                    <div key={rek.id} onClick={()=>{ setPayment({...payment, transferTo: `${rek.bankName} - ${rek.accountNumber} - ${rek.accountHolder}`}); setStep(3); }} className="p-8 border-2 border-zinc-50 rounded-2xl hover:border-[#D4AF37] hover:bg-zinc-50/50 cursor-pointer transition-all active:scale-95 group flex items-center justify-between shadow-sm">
                       <div className="flex flex-col gap-4">
                          <img src={BANK_LOGOS[rek.bankName]} className="h-5 object-contain w-20 text-left grayscale group-hover:grayscale-0 transition-all duration-700" alt=""/>
                          <div className="space-y-1"><p className="text-xl font-mono font-bold tracking-tighter text-black">{String(rek.accountNumber)}</p><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">A.N {String(rek.accountHolder)}</p></div>
                       </div>
                       <ArrowRight size={22} className="text-zinc-200 group-hover:text-black transition-all"/>
                    </div>
                  ))}
               </div>
               <button onClick={()=>setStep(1)} className="w-full py-4 text-[10px] font-bold uppercase text-zinc-300 hover:text-black transition-all bg-transparent border-none cursor-pointer">Kembali ke Alamat</button>
            </div>
          )}

          {/* STEP 3: KONFIRMASI PEMBAYARAN (PERSIS FOTO) */}
          {step === 3 && (
            <div className="p-8 md:p-10 space-y-10">
               <h3 className="text-xl font-bold text-center border-b pb-4">Konfirmasi Pembayaran</h3>
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Nomor Invoice</label>
                    <input className="w-full bg-zinc-50 p-4 rounded-xl text-sm font-bold border-none outline-none text-zinc-500" value={payment.invoice} readOnly/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Waktu Pembayaran</label>
                    <input className="w-full bg-zinc-50 p-4 rounded-xl text-sm font-bold border-none outline-none text-black" value={payment.paymentTime} readOnly/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Ditransfer Ke</label>
                    <div className="w-full bg-zinc-100 p-4 rounded-xl text-[10px] font-bold text-zinc-500 uppercase">{payment.transferTo}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Bank Asal</label>
                    <input className="w-full border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-400" placeholder="BCA / BRI / Mandiri" value={payment.originBank} onChange={e=>setPayment({...payment, originBank:e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Nama Pemilik Rekening</label>
                    <input className="w-full border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-400" placeholder="Nama di Struk" value={payment.senderName} onChange={e=>setPayment({...payment, senderName:e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Jumlah</label>
                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm">Rp</span><input className="w-full bg-zinc-50 p-4 pl-12 rounded-xl text-base font-bold border-none text-black" value={payment.amount} readOnly/></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Bukti Transfer (Opsional)</label>
                    <div onClick={()=>document.getElementById('uPf').click()} className="w-full aspect-video border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden group shadow-inner relative transition-all hover:bg-zinc-100">
                       {payment.proofImage ? <img src={payment.proofImage} className="w-full h-full object-cover"/> : (
                         <div className="text-center space-y-2">
                            {uploading ? <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} /> : <Upload className="text-zinc-300 mx-auto" size={32} />}
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Upload Gambar</p>
                         </div>
                       )}
                       <input type="file" id="uPf" className="hidden" accept="image/*" onChange={handleUpload}/>
                    </div>
                  </div>
               </div>
               <button onClick={submitOrder} disabled={uploading} className="w-full bg-[#3b82f6] text-white py-6 rounded-xl font-bold text-sm shadow-xl hover:bg-blue-700 transition-all border-none cursor-pointer disabled:opacity-50">Konfirmasi</button>
               
               {/* Bank Info small below */}
               <div className="pt-8 border-t border-zinc-100 space-y-4">
                  {rekening.map(rek => (
                    <div key={rek.id} className="flex items-center gap-4 text-zinc-500">
                       <img src={BANK_LOGOS[rek.bankName]} className="h-4 object-contain grayscale opacity-50 w-12" alt=""/>
                       <div className="text-[9px] font-bold uppercase tracking-tight">
                          {rek.bankName} <br/> {rek.accountNumber} <br/> {rek.accountHolder}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* STEP 4: SUCCESS VIEW */}
          {step === 4 && (
            <div className="p-16 text-center space-y-10 animate-in zoom-in duration-1000">
               <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl border-[10px] border-white"><Check size={48}/></div>
               <div className="space-y-4 text-black font-bold uppercase">
                  <h3 className="text-3xl font-serif">Order Securely Sent</h3>
                  <p className="text-[10px] text-zinc-400 tracking-[0.5em]">Pesanan Anda sedang diproses admin.</p>
               </div>
               <div className="flex flex-col gap-4 pt-10">
                  <button onClick={downloadReceipt} className="flex items-center justify-center gap-4 bg-white border-2 border-zinc-100 p-6 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all cursor-pointer"><Download size={18}/> Unduh Struk Digital</button>
                  <button onClick={onComplete} className="bg-black text-[#D4AF37] p-6 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-2xl border-none cursor-pointer">Kembali Beranda</button>
               </div>
            </div>
          )}
       </div>
    </div>
  );
}

/**
 * --- COMPONENT: ADMIN DASHBOARD (PERBAIKAN PUBLISH) ---
 */
function AdminDashboard({ products, orders, rekening, appId, onLogout }) {
  const [tab, setTab] = useState('inventory');
  const [saving, setSaving] = useState(false);
  const [instaUrl, setInstaUrl] = useState('');
  const [formData, setFormData] = useState({ 
    imageURL: '', name: '', price: '', category: 'Baju', description: '', sizes: [], sizePrices: {} 
  });

  const handleSizeToggle = (s) => {
    setFormData(prev => {
      const newSizes = prev.sizes.includes(s) ? prev.sizes.filter(x => x !== s) : [...prev.sizes, s];
      return { ...prev, sizes: newSizes };
    });
  };

  const publishProduct = async () => {
    if (!formData.name.trim() || !formData.price || !formData.imageURL || !formData.description.trim()) {
      return alert("Harap isi Nama, Harga Dasar, Gambar IG, dan Material/Deskripsi produk!");
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
      alert("PRODUK EKSKLUSIF BERHASIL DIPUBLIKASIKAN.");
    } catch (e) { alert("Gagal Publikasi: " + e.message); } 
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 text-black">
      <aside className="lg:w-80 space-y-10">
         <div className="bg-zinc-950 p-12 rounded-[4rem] text-white shadow-2xl relative border border-white/5 overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
           <Settings className="text-[#D4AF37] mb-8 animate-[spin_12s_linear_infinite]" size={48} />
           <p className="text-[10px] font-bold uppercase tracking-[0.8em] text-zinc-500 mb-2">Boutique</p>
           <h2 className="text-3xl font-serif italic tracking-widest font-bold">Control Panel</h2>
         </div>
         <div className="bg-white p-6 rounded-[3rem] border border-zinc-100 flex flex-col gap-3 shadow-sm">
            {['inventory', 'orders', 'banking'].map(t => (
              <button key={t} onClick={()=>setTab(t)} className={`text-left px-10 py-5 rounded-2xl text-[12px] font-bold uppercase tracking-[0.5em] transition-all border-none cursor-pointer ${tab === t ? 'bg-black text-[#D4AF37] shadow-xl' : 'text-zinc-300 hover:bg-zinc-50 bg-transparent'}`}>{String(t).toUpperCase()}</button>
            ))}
            <button onClick={onLogout} className="text-left px-10 py-5 rounded-2xl text-[12px] font-bold uppercase text-red-500 border-none bg-transparent cursor-pointer hover:bg-red-50 mt-12 tracking-[0.5em]">Logout Portal</button>
         </div>
      </aside>

      <div className="flex-1 bg-white p-10 md:p-20 rounded-[4.5rem] border border-zinc-100 min-h-[90vh] shadow-sm relative overflow-hidden">
         {tab === 'inventory' && (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
              <div className="space-y-12">
                 <h3 className="text-xs font-bold uppercase tracking-[0.5em] text-[#D4AF37] border-b border-zinc-50 pb-6 italic">Publish New Masterpiece</h3>
                 
                 <div className="aspect-[3/4.5] bg-zinc-50 rounded-[4.5rem] border-2 border-dashed border-zinc-100 overflow-hidden relative shadow-inner group">
                    {formData.imageURL ? (
                      <img src={formData.imageURL} className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-110"/>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
                        <Instagram size={80} />
                        <p className="text-[12px] font-bold uppercase tracking-[1em] mt-6 text-black">Awaiting Visual</p>
                      </div>
                    )}
                 </div>

                 <div className="space-y-10 text-black font-bold">
                    <div className="flex gap-5">
                      <input className="flex-1 bg-zinc-50 p-7 rounded-[2rem] border-none text-[11px] font-bold uppercase outline-none shadow-inner text-black placeholder:text-zinc-200" placeholder="Instagram URL..." value={instaUrl} onChange={e=>setInstaUrl(e.target.value)}/>
                      <button onClick={()=>{ 
                        const clean = instaUrl.split('?')[0]; 
                        setFormData({...formData, imageURL: `https://images.weserv.nl/?url=${encodeURIComponent(clean.endsWith('/') ? clean + 'media/?size=l' : clean + '/media/?size=l')}&w=1000&output=jpg`});
                        alert("Visual Masterpiece Berhasil Ditarik."); 
                      }} className="bg-black text-[#D4AF37] px-12 rounded-[2rem] text-[11px] font-bold uppercase tracking-widest border-none cursor-pointer outline-none">Fetch</button>
                    </div>
                    
                    <input className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-base font-bold uppercase text-black shadow-inner outline-none" placeholder="Masterpiece Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                    
                    <div className="grid grid-cols-2 gap-8">
                       <input type="number" className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-base font-bold text-black shadow-inner outline-none" placeholder="Base Price (IDR)" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                       <select className="w-full bg-zinc-50 p-7 rounded-[2rem] border-none text-[12px] font-bold uppercase text-black shadow-inner outline-none cursor-pointer bg-transparent appearance-none" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                          {CATEGORIES.map(c=><option key={c} value={c}>{String(c)}</option>)}
                       </select>
                    </div>

                    <div className="space-y-10 p-12 bg-zinc-50 rounded-[4rem] shadow-inner border border-zinc-100">
                       <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.5em] border-b border-zinc-200 pb-6 text-center">Specific Size Pricing</p>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                          {SIZE_OPTIONS.map(s => (
                            <div key={s} className="space-y-3">
                               <button onClick={()=>handleSizeToggle(s)} className={`w-full py-4 rounded-xl text-[10px] font-bold uppercase transition-all duration-500 border-none outline-none ${formData.sizes.includes(s) ? 'bg-black text-[#D4AF37] shadow-2xl scale-105' : 'bg-white text-zinc-200 border border-zinc-100'}`}>{s}</button>
                               {formData.sizes.includes(s) && (
                                 <input type="number" className="w-full bg-white border-2 border-zinc-100 p-4 rounded-2xl text-[11px] font-bold focus:border-[#D4AF37] outline-none shadow-sm" placeholder="Price IDR" value={formData.sizePrices[s] || ''} onChange={e=>setFormData({...formData, sizePrices: {...formData.sizePrices, [s]: Number(e.target.value)}})}/>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[11px] font-bold uppercase text-zinc-400 ml-6 tracking-[0.5em]">Materials & Description (Cantik)</label>
                       <textarea className="w-full bg-zinc-50 p-12 rounded-[4rem] border-none text-base font-medium leading-relaxed italic text-black shadow-inner h-64 outline-none resize-none" placeholder="Jelaskan kualitas material, motif, dan keanggunan produk ini di sini..." value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/>
                    </div>
                    
                    <button onClick={publishProduct} disabled={saving} className="w-full bg-black text-[#D4AF37] py-10 rounded-[4rem] font-bold uppercase text-[13px] tracking-[1em] shadow-[0_40px_80px_rgba(0,0,0,0.25)] disabled:opacity-50 border-none cursor-pointer hover:bg-zinc-900 transition-all active:scale-95 flex items-center justify-center gap-8 relative group overflow-hidden outline-none">
                       <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       {saving ? <Loader2 className="animate-spin" size={32} /> : <Zap size={28} />}
                       {saving ? "Publishing Masterpiece..." : "Release to Boutique"}
                    </button>
                 </div>
              </div>
              
              <div className="space-y-16 max-h-[1400px] overflow-y-auto no-scrollbar border-l-[1px] border-zinc-100 pl-16 text-black">
                 <h3 className="text-[12px] font-bold uppercase tracking-[0.8em] text-zinc-200 mb-10 italic text-center">Live Collection Inventory ({products.length})</h3>
                 <div className="space-y-8">
                  {products.map(p => (
                    <div key={p.id} className="p-10 bg-white border border-zinc-100 rounded-[3.5rem] flex items-center justify-between shadow-sm group hover:shadow-2xl transition-all duration-700">
                        <div className="flex items-center gap-8 text-black font-bold">
                           <img src={p.imageURL} className="w-20 h-28 rounded-3xl object-cover border border-zinc-50 shadow-md transform group-hover:rotate-2 transition-transform" alt=""/>
                           <div className="space-y-2">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-800">{String(p.name)}</h4>
                              <p className="text-[11px] text-[#D4AF37] font-bold italic tracking-tighter">{formatIDR(p.price)}</p>
                              <div className="flex gap-2">
                                 {p.sizes?.slice(0,3).map(sz => <span key={sz} className="text-[8px] bg-zinc-50 px-2 py-0.5 rounded-full font-bold text-zinc-300">{sz}</span>)}
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={async()=>{ if(window.confirm("Hapus produk eksklusif ini dari katalog publik?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id)); }} 
                          className="p-6 text-zinc-100 hover:text-red-500 bg-zinc-50 rounded-[2rem] transition-all border-none bg-transparent cursor-pointer group-hover:translate-x-2 outline-none"
                        >
                          <Trash2 size={24}/>
                        </button>
                    </div>
                  ))}
                 </div>
              </div>
           </div>
         )}

         {tab === 'orders' && (
           <div className="space-y-20 animate-in fade-in duration-1000 text-black">
              <div className="text-center space-y-4">
                 <h3 className="text-5xl font-serif font-bold italic uppercase tracking-tighter">Concierge Orders</h3>
                 <p className="text-[11px] text-[#D4AF37] uppercase tracking-[1em] font-bold">Client Transaction Validation</p>
              </div>
              <div className="grid grid-cols-1 gap-14 text-black">
                 {orders.length === 0 ? (
                   <div className="py-60 text-center text-zinc-100 uppercase font-bold text-[14px] tracking-[2em]">Empty Ledger</div>
                 ) : orders.map(o => (
                   <div key={o.id} className="p-14 bg-white border border-zinc-100 rounded-[5rem] flex flex-col xl:flex-row justify-between gap-16 relative overflow-hidden shadow-sm hover:shadow-[0_60px_120px_rgba(0,0,0,0.08)] transition-all duration-1000">
                      <div className={`absolute left-0 top-0 w-3 h-full ${o.status === 'pending' ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
                      
                      <div className="flex items-center gap-14 flex-1">
                         <div className="cursor-pointer relative group" onClick={()=>window.open(o.proofImage, '_blank')}>
                            <img src={o.proofImage || "https://placehold.co/150x200?text=No+Proof"} className="w-48 h-64 rounded-[3.5rem] object-cover shadow-2xl border-4 border-white transition-transform group-hover:scale-105 duration-700"/>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all rounded-[3.5rem] flex flex-col items-center justify-center text-white text-[12px] font-bold gap-4">
                               <Search size={32} className="animate-pulse" />
                               <span className="tracking-[0.4em]">INSPECT PROOF</span>
                            </div>
                         </div>
                         <div className="space-y-8 flex-1 text-black font-bold">
                            <div className="flex items-center gap-6">
                               <span className={`text-[10px] font-bold px-8 py-3 rounded-full shadow-lg tracking-widest ${o.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                                  {String(o.status).toUpperCase()}
                               </span>
                               <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-[0.3em]">REF: {String(o.invoice)}</span>
                            </div>
                            <h4 className="text-4xl font-serif font-bold italic uppercase tracking-tighter text-black border-b border-zinc-50 pb-6">{String(o.senderName || o.shipping?.name)}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-400">
                               <div className="space-y-2"><span>Selection</span> <p className="text-black text-sm tracking-tighter">{String(o.productName)} ({String(o.productSize)})</p></div>
                               <div className="space-y-2"><span>Total</span> <p className="text-[#3a7d44] text-sm tracking-tighter">{formatIDR(o.amount)}</p></div>
                               <div className="space-y-2"><span>Origin Bank</span> <p className="text-[#D4AF37] text-sm tracking-tighter uppercase">{String(o.originBank)}</p></div>
                            </div>
                         </div>
                      </div>

                      <div className="flex xl:flex-col items-center justify-center gap-6 pt-14 xl:pt-0 border-t xl:border-t-0 xl:border-l border-zinc-50 xl:pl-16">
                         {o.status === 'pending' && (
                           <button 
                             onClick={async()=>await updateDoc(doc(db,'artifacts',appId,'public', 'data', 'orders', o.id), {status:'confirmed'})} 
                             className="w-full xl:w-56 bg-black text-[#D4AF37] py-6 rounded-3xl text-[11px] font-bold uppercase tracking-[0.5em] border-none cursor-pointer shadow-2xl hover:bg-[#3a7d44] hover:text-white transition-all duration-500 active:scale-95 outline-none"
                           >
                             Confirm Access
                           </button>
                         )}
                         <button 
                          onClick={async()=>{ if(window.confirm("Permanently erase this client record?")) await deleteDoc(doc(db,'artifacts',appId,'public','data','orders',o.id)); }} 
                          className="p-8 text-zinc-100 hover:text-red-500 bg-zinc-50 rounded-[2.5rem] transition-all border-none bg-transparent cursor-pointer shadow-inner active:scale-95 outline-none"
                         >
                           <Trash2 size={32}/>
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         )}
      </div>
    </div>
  );
}

/**
 * --- COMPONENT: NEWSLETTER ---
 */
function NewsletterSection() {
  return (
    <section className="bg-white py-48 px-6 border-t border-zinc-100 overflow-hidden relative">
       <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
       <div className="max-w-4xl mx-auto text-center space-y-14 relative z-10">
          <div className="w-24 h-24 bg-zinc-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-sm text-[#D4AF37]"><Mail size={40} /></div>
          <div className="space-y-8">
             <h2 className="text-5xl md:text-8xl font-serif font-bold italic tracking-tighter uppercase text-zinc-900 leading-none">Maison <br/> <span className="text-[#D4AF37]">Newsletter</span></h2>
             <p className="text-zinc-400 text-sm md:text-xl max-w-2xl mx-auto font-medium tracking-widest leading-relaxed">Bergabunglah dengan daftar eksklusif kami untuk mendapatkan pembaruan koleksi terbatas langsung ke inbox Anda.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto">
             <input className="flex-1 bg-zinc-50 p-9 rounded-[2.5rem] border-none text-base font-bold shadow-inner outline-none text-black placeholder:text-zinc-200" placeholder="E-mail Address..."/>
             <button className="bg-black text-[#D4AF37] px-16 py-9 rounded-[2.5rem] font-bold uppercase text-[12px] tracking-[0.5em] shadow-2xl border-none cursor-pointer hover:bg-zinc-800 transition-all outline-none active:scale-95">Subscribe Now</button>
          </div>
       </div>
    </section>
  );
}

/**
 * --- COMPONENT: CART VIEW ---
 */
function CartView({ items, onRemove, onCheckout }) {
  const total = items.reduce((s, i) => s + Number(i.chosenPrice || i.price), 0);
  return (
    <div className="max-w-5xl mx-auto py-32 px-6 text-black animate-in slide-in-from-bottom duration-1000">
       <div className="text-center mb-28 space-y-8">
          <h2 className="text-6xl md:text-[9rem] font-serif font-bold italic tracking-tighter uppercase text-zinc-900 leading-none">Shopping <span className="text-[#D4AF37]">Bag</span></h2>
          <div className="w-40 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto opacity-30"></div>
       </div>
       {items.length === 0 ? (
         <div className="text-center py-52 border-2 border-dashed border-zinc-100 rounded-[5rem] bg-white group hover:border-[#D4AF37]/30 transition-all duration-1000">
            <ShoppingBag size={120} className="mx-auto text-zinc-50 mb-12 group-hover:scale-110 transition-transform duration-1000 group-hover:text-[#D4AF37]/10" />
            <p className="text-zinc-300 font-bold uppercase text-[15px] tracking-[1.5em]">Bag is currently empty</p>
         </div>
       ) : (
         <div className="space-y-16 text-black">
            {items.map((item, idx) => (
              <div key={idx} className="p-12 bg-white border border-zinc-100 rounded-[4rem] flex flex-col md:flex-row items-center justify-between group hover:shadow-[0_80px_160px_rgba(0,0,0,0.08)] transition-all duration-1000">
                 <div className="flex flex-col md:flex-row items-center gap-16 text-center md:text-left">
                    <div className="relative group/img">
                      <img src={item.imageURL} className="w-40 h-52 rounded-[3.5rem] object-cover border border-zinc-50 shadow-2xl transition-transform duration-1000 group-hover/img:scale-105 group-hover/img:rotate-2"/>
                      <div className="absolute -top-5 -right-5 w-12 h-12 bg-black text-[#D4AF37] rounded-full flex items-center justify-center font-bold text-sm shadow-2xl border-[3px] border-white">1</div>
                    </div>
                    <div className="space-y-5">
                       <h4 className="text-3xl font-serif font-bold uppercase tracking-tight text-zinc-800">{String(item.name)}</h4>
                       <div className="flex gap-6 items-center justify-center md:justify-start">
                          <span className="text-[11px] font-bold px-7 py-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full uppercase tracking-widest border border-[#D4AF37]/20 shadow-sm">Size {String(item.chosenSize || "Default")}</span>
                          <span className="text-base font-bold text-zinc-300 font-serif italic tracking-tighter">{formatIDR(item.chosenPrice || item.price)}</span>
                       </div>
                    </div>
                 </div>
                 <div className="mt-14 md:mt-0 flex items-center gap-16">
                    <p className="text-4xl font-serif font-bold italic tracking-tighter text-zinc-900">{formatIDR(item.chosenPrice || item.price)}</p>
                    <button onClick={()=>onRemove(idx)} className="p-8 text-zinc-100 hover:text-red-500 bg-zinc-50 rounded-[2.5rem] transition-all border-none bg-transparent cursor-pointer shadow-inner active:scale-90 outline-none"><Trash2 size={32}/></button>
                 </div>
              </div>
            ))}
            <div className="pt-24 border-t-2 border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-16">
               <div className="text-center md:text-left space-y-4">
                  <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-[0.8em]">Total Invoiced</p>
                  <p className="text-7xl md:text-[10rem] font-serif font-bold italic tracking-tighter text-zinc-950 leading-none">{formatIDR(total)}</p>
               </div>
               <button onClick={onCheckout} className="group w-full md:w-auto bg-black text-[#D4AF37] px-36 py-11 rounded-full font-bold uppercase text-[15px] tracking-[1em] shadow-[0_60px_120px_rgba(0,0,0,0.2)] border-none cursor-pointer hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-8 relative overflow-hidden outline-none">
                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 Checkout <ArrowRight size={28} className="group-hover:translate-x-4 transition-transform duration-500" />
               </button>
            </div>
         </div>
       )}
    </div>
  );
}

/**
 * --- COMPONENT: ADMIN LOGIN ---
 */
function AdminLogin({ creds, onLoginSuccess, onBack }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const handle = (e) => {
    e.preventDefault();
    const inputU = u.trim().toLowerCase();
    if (!creds) return alert("System initialising, hold on...");
    if (inputU === (creds.username || 'admin').toLowerCase() && p === (creds.password || 'admin123')) onLoginSuccess();
    else alert("Security Alert: Invalid Kredensial.");
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/98 backdrop-blur-[50px] animate-in zoom-in duration-700 text-black">
      <div className="bg-white w-full max-w-md rounded-[5rem] p-20 relative shadow-[0_100px_200px_rgba(0,0,0,0.5)] border border-[#D4AF37]/30 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>
        <button onClick={onBack} className="absolute top-12 right-12 text-zinc-300 hover:text-black transition-all border-none bg-transparent cursor-pointer outline-none group"><X size={40} className="group-hover:rotate-90 transition-transform duration-500" /></button>
        <div className="text-center mb-20 space-y-10">
          <div className="w-32 h-32 bg-zinc-50 rounded-[4rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#D4AF37]/10 text-[#D4AF37] animate-pulse">
            <Lock size={60} />
          </div>
          <div className="space-y-4">
            <h3 className="text-4xl font-serif font-bold uppercase tracking-tight text-zinc-900">Maison Portal</h3>
            <p className="text-[11px] text-zinc-400 mt-2 uppercase font-bold tracking-[0.8em] italic">Standard Encryption Active</p>
          </div>
        </div>
        <form onSubmit={handle} className="space-y-10">
          <div className="space-y-3 text-black font-bold uppercase">
            <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 ml-6">Admin Identity</label>
            <input placeholder="Administrator" value={u} onChange={e=>setU(e.target.value)} className="w-full bg-zinc-50 p-8 rounded-[2.5rem] outline-none font-bold uppercase text-[12px] border-none shadow-inner text-black tracking-widest focus:ring-1 focus:ring-black transition-all" autoCapitalize="none"/>
          </div>
          <div className="space-y-3 text-black font-bold uppercase">
            <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 ml-6">Security Key</label>
            <input type="password" placeholder="••••••••" value={p} onChange={e=>setP(e.target.value)} className="w-full bg-zinc-50 p-8 rounded-[2.5rem] outline-none font-bold border-none shadow-inner text-black tracking-widest focus:ring-1 focus:ring-black transition-all"/>
          </div>
          <button type="submit" className="w-full bg-black text-[#D4AF37] py-9 rounded-[3rem] font-bold uppercase text-[13px] tracking-[1em] shadow-[0_40px_80px_rgba(0,0,0,0.4)] hover:bg-[#D4AF37] hover:text-black transition-all border-none cursor-pointer mt-10 active:scale-95 group relative overflow-hidden outline-none">
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             Verify & Enter
          </button>
        </form>
        <div className="mt-20 text-center space-y-6">
           <div className="flex items-center justify-center gap-3 text-zinc-300"><ShieldAlert size={14}/> <p className="text-[9px] font-bold uppercase tracking-[0.6em]">System Encrypted 256-bit</p></div>
        </div>
      </div>
    </div>
  );
}

/**
 * --- COMPONENT: FOOTER ---
 */
function Footer({ setView }) {
  return (
    <footer className="bg-[#050505] text-white pt-40 pb-20 px-10 relative overflow-hidden border-t-2 border-[#D4AF37]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-40"></div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-32 relative z-10">
        <div className="col-span-1 md:col-span-2 space-y-16">
           <div className="space-y-8">
              <h2 className="text-5xl font-serif font-bold italic tracking-[0.4em] text-[#D4AF37] uppercase leading-none">DEVI OFFICIAL</h2>
              <p className="text-zinc-500 text-base max-w-md leading-[2] font-medium tracking-widest uppercase italic opacity-70">Elevating modest fashion to a global standard of absolute luxury and sophistication.</p>
           </div>
           <div className="flex gap-14">
              <Instagram className="text-zinc-600 hover:text-[#D4AF37] cursor-pointer transition-all duration-700 hover:scale-125" size={28} />
              <Mail className="text-zinc-600 hover:text-[#D4AF37] cursor-pointer transition-all duration-700 hover:scale-125" size={28} />
              <Globe className="text-zinc-600 hover:text-[#D4AF37] cursor-pointer transition-all duration-700 hover:scale-125" size={28} />
           </div>
        </div>
        <div className="space-y-12">
           <h4 className="text-[12px] font-bold uppercase tracking-[0.6em] text-zinc-100 border-b border-zinc-900 pb-6">Payment Secured</h4>
           <div className="grid grid-cols-3 gap-8 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-[1.5s]">
              {Object.values(BANK_LOGOS).slice(0,6).map((l, i) => <img key={i} src={l} className="h-5 object-contain" alt="Bank" />)}
           </div>
        </div>
        <div className="space-y-12 text-black">
           <h4 className="text-[12px] font-bold uppercase tracking-[0.6em] text-zinc-100 border-b border-zinc-900 pb-6">Concierge Center</h4>
           <div className="space-y-8 text-[14px] text-zinc-500 font-medium tracking-[0.2em] uppercase">
              <p className="flex items-center gap-5 group cursor-pointer text-white"><MapPin size={22} className="text-zinc-800 group-hover:text-[#D4AF37] transition-all" /> HQ: Jakarta, ID</p>
              <p className="flex items-center gap-5 group cursor-pointer text-white"><Phone size={22} className="text-zinc-800 group-hover:text-[#D4AF37] transition-all" /> +62 812 9988 7766</p>
           </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-40 pt-16 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-14">
         <div className="text-zinc-800 text-[10px] uppercase tracking-[1em] font-bold">© 2024 DEVI_OFFICIAL LUXURY GROUP. INTERNATIONAL TRADEMARK.</div>
         <button onClick={() => setView('login')} className="flex items-center gap-4 text-zinc-700 text-[11px] font-bold tracking-[0.5em] hover:text-[#D4AF37] transition-all border border-zinc-900 px-12 py-5 rounded-full hover:border-[#D4AF37]/40 bg-transparent cursor-pointer uppercase shadow-inner group outline-none active:scale-95">
            <ShieldAlert size={18} className="group-hover:animate-bounce" /> SECURE LOGIN
         </button>
      </div>
    </footer>
  );
}
