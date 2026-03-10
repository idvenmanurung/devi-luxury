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
  getDoc,
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
  Minus,
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
  Layers as LayersMenu,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

/**
 * ==========================================================================================
 * --- DEVI OFFICIAL LUXURY BOUTIQUE ECOSYSTEM ---
 * VERSION: 38.8.0 (FIXED PHONE & EXPEDITION DISPLAY)
 * ==========================================================================================
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

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'];
const AGE_OPTIONS = ['1-2 Thn', '3-4 Thn', '5-6 Thn', '7-8 Thn', '9-10 Thn', '11-12 Thn'];

const DEFAULT_SHIPPING = [
  { id: 'jne_reg', name: 'JNE - REG', price: 10000, logo: '/logo1.png' },
  { id: 'jnt_reg', name: 'J&T EXPRESS', price: 11000, logo: '/logo2.png' },
  { id: 'anteraja', name: 'Anteraja', price: 9000, logo: '/logo3.png' },
  { id: 'sicepat', name: 'SiCepat Ekspres', price: 10000, logo: '/logo4.png' },
  { id: 'ninja', name: 'Ninja Xpress', price: 10500, logo: '/logo5.png' }
];

const BANK_LOGOS = {
  "Bank Central Asia (BCA)": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
  "Bank Mandiri": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
  "Bank Rakyat Indonesia (BRI)": "/12.png",
  "Bank Negara Indonesia (BNI)": "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg",
  "Bank CIMB Niaga": "https://upload.wikimedia.org/wikipedia/commons/5/5e/CIMB_Niaga_logo.svg",
  "Bank Danamon": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Danamon_logo.svg",
  "Bank Permata": "https://upload.wikimedia.org/wikipedia/commons/b/b5/PermataBank_logo.svg",
  "Bank Syariah Indonesia": "https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia_logo.svg",
  "GoPay": "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg",
  "OVO": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg",
  "DANA": "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dan_automotive.png",
  "ShopeePay": "https://upload.wikimedia.org/wikipedia/commons/b/be/ShopeePay.svg",
  "LinkAja": "https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg",
  "iSaku": "https://upload.wikimedia.org/wikipedia/id/c/c8/Logo_DOKU.png",
  "Sakuku": "https://upload.wikimedia.org/wikipedia/id/3/30/Sakuku_logo.png"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = initializeFirestore(firebaseApp, { experimentalForceLongPolling: false });

const compressImage = (file, maxWidth = 1024) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
};

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
  const [shippingMethods, setShippingMethods] = useState(DEFAULT_SHIPPING);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message: String(message), type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try { 
        await signInAnonymously(auth); 
        setLoading(false);
      } catch (err) { 
        console.error("Kesalahan Sistem Autentikasi", err); 
        setLoading(false);
      }
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
    const sRef = collection(db, 'artifacts', appId, 'public', 'data', 'shipping_config');

    const unsubP = onSnapshot(pRef, (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubR = onSnapshot(rRef, (s) => setRekening(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubO = onSnapshot(oRef, (s) => {
      const docs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(docs);
    });
    const unsubA = onSnapshot(aRef, (s) => {
      const found = s.docs.find(d => d.id === 'main');
      if (found) setAdminCreds(found.data());
    });
    const unsubS = onSnapshot(sRef, (s) => {
      const found = s.docs.find(d => d.id === 'methods');
      if (found) setShippingMethods(found.data().list || DEFAULT_SHIPPING);
    });
    
    return () => { unsubP(); unsubR(); unsubO(); unsubA(); unsubS(); };
  }, [user]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = String(p.name || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [products, searchTerm]);

  if (loading) return <PremiumLoader />;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased overflow-x-hidden selection:bg-[#D4AF37] selection:text-white">
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[5000] flex flex-col gap-2 w-full max-w-xs px-4 pointer-events-none">
        {notifications.map(n => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>

      <Header cartCount={cart.length} isAdmin={isAdminLoggedIn} setView={setView} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <div className="pt-14 md:pt-20">
        <main>
          {view === 'shop' && (
            <div className="animate-in fade-in duration-500">
              <HeroSection onExplore={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })} />
              <ProductGrid products={filteredProducts} onView={(p) => { setSelectedProduct(p); setView('detail'); window.scrollTo(0,0); }} />
              <MembershipBanner />
            </div>
          )}

          {view === 'detail' && selectedProduct && (
            <ProductDetailView 
              product={selectedProduct} 
              onBack={() => setView('shop')} 
              onBuy={(size, age, price, qty) => { 
                setSelectedProduct({...selectedProduct, chosenSize: size, chosenAge: age, chosenPrice: price, quantity: qty}); 
                setView('checkout'); 
                window.scrollTo(0,0);
              }}
              onAddToCart={(p) => { setCart([...cart, p]); notify(`Ditambahkan ke Keranjang.`, "success"); }}
              notify={notify}
            />
          )}

          {view === 'checkout' && selectedProduct && (
            <CheckoutWizard 
              product={selectedProduct} 
              rekening={rekening} 
              shippingMethods={shippingMethods}
              onComplete={() => { setView('shop'); }} 
              onBack={() => setView('shop')} 
              notify={notify} 
            />
          )}

          {view === 'cart' && (
            <CartView items={cart} onRemove={(idx) => { const nc = [...cart]; nc.splice(idx,1); setCart(nc); }} onCheckout={() => { if(cart.length > 0) { setSelectedProduct(cart[0]); setView('checkout'); } }} />
          )}

          {view === 'login' && (
            <AdminLogin creds={adminCreds} onLoginSuccess={() => { setIsAdminLoggedIn(true); setView('admin'); }} onBack={() => setView('shop')} notify={notify} />
          )}
          
          {view === 'admin' && isAdminLoggedIn && (
            <AdminDashboard products={products} orders={orders} rekening={rekening} shippingMethods={shippingMethods} appId={appId} onLogout={() => { setIsAdminLoggedIn(false); setView('shop'); }} notify={notify} creds={adminCreds} />
          )}
        </main>
      </div>
      <Footer setView={setView} notify={notify} />
    </div>
  );
}

function PremiumLoader() {
  return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 text-white font-bold animate-pulse">
      <div className="w-10 h-10 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
      <h2 className="font-serif text-base text-[#D4AF37] tracking-[0.2em] uppercase font-black">DEVI OFFICIAL</h2>
    </div>
  );
}

function Header({ cartCount, isAdmin, setView, searchTerm, setSearchTerm }) {
  return (
    <header className="fixed top-0 left-0 w-full z-[100] h-14 md:h-16 bg-white/90 backdrop-blur-md border-b border-zinc-100 flex items-center px-4 font-bold uppercase text-black">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between font-bold">
        <div className="hidden md:flex flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input type="text" placeholder="Cari Koleksi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-zinc-50 border-none rounded-full pl-9 pr-4 py-1.5 text-xs w-48 focus:w-60 transition-all outline-none font-bold" />
          </div>
        </div>
        <div className="flex-1 text-center cursor-pointer font-bold" onClick={() => setView('shop')}>
          <h1 className="text-sm md:text-xl font-serif tracking-[0.2em] font-black text-black uppercase leading-none">DEVI<span className="text-[#D4AF37]">_OFFICIAL</span></h1>
        </div>
        <div className="flex-1 flex justify-end gap-4 items-center">
            <button onClick={() => setView('cart')} className="relative p-2 bg-transparent border-none cursor-pointer">
                <BagIcon size={22}/>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
            </button>
            {isAdmin ? <button onClick={() => setView('admin')} className="p-2 bg-black text-[#D4AF37] rounded-full border-none cursor-pointer"><LayoutDashboard size={18}/></button> : <button onClick={() => setView('login')} className="p-2 bg-zinc-50 rounded-full border-none cursor-pointer"><Key size={18}/></button>}
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onExplore }) {
  return (
    <section className="relative h-[50vh] md:h-[75vh] flex items-center justify-center overflow-hidden bg-zinc-950 font-bold uppercase">
      <img 
        src="https://images.unsplash.com/photo-1549439602-43ebcb232811?q=80&w=2070&auto=format&fit=crop" 
        className="absolute inset-0 w-full h-full object-cover opacity-70 font-bold" 
        alt="Helenaraya Collection"
      />
      <div className="relative z-10 text-center text-white px-6 font-bold uppercase animate-in slide-in-from-bottom duration-700">
        <p className="text-[9px] tracking-[0.6em] text-[#D4AF37] mb-2 font-black uppercase">Butik Mewah</p>
        <h2 className="text-3xl md:text-7xl font-serif italic mb-6 font-black tracking-tight leading-tight">Helenaraya Collection</h2>
        <button onClick={onExplore} className="px-10 py-4 bg-[#D4AF37] text-black text-[10px] font-black tracking-widest rounded-full border-none cursor-pointer uppercase shadow-2xl active:scale-95 transition-all hover:brightness-110">Jelajahi Sekarang</button>
      </div>
    </section>
  );
}

function ProductGrid({ products, onView }) {
  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 lg:grid-cols-4 gap-6 font-bold uppercase min-h-[400px]">
      {products.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
           <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
           <p className="text-[10px] tracking-widest text-zinc-400">MEMUAT PRODUK...</p>
        </div>
      ) : products.map(p => (
        <div key={p.id} className="cursor-pointer group flex flex-col items-center font-bold animate-in fade-in duration-500" onClick={() => onView(p)}>
          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-100 mb-3 shadow-sm group-hover:shadow-lg transition-all font-bold">
            <img 
              src={p.imageURLs?.[0] || p.imageURL} 
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
              alt={p.name}
              loading="lazy" 
            />
          </div>
          <div className="text-center space-y-1 w-full font-bold uppercase">
            <h3 className="text-[10px] font-serif tracking-wide text-zinc-500 truncate font-black uppercase">{String(p.name)}</h3>
            <p className="text-sm font-black text-black">{formatIDR(p.price)}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function MembershipBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 pb-20 font-bold uppercase">
      <div className="bg-[#0D0D0D] rounded-3xl p-10 md:p-20 text-center text-white border border-white/5 shadow-2xl font-bold uppercase">
        <h2 className="text-2xl md:text-5xl font-serif italic mb-4 font-black">Privilege <span className="text-[#D4AF37]">Maison</span> Member</h2>
        <p className="text-zinc-500 text-xs md:text-sm tracking-widest max-w-lg mx-auto mb-8 leading-relaxed font-black">Nikmati akses eksklusif untuk koleksi terbatas dan penawaran khusus dari Maison Devi.</p>
        <button className="px-10 py-3 bg-white text-black text-[9px] font-black tracking-widest rounded-full border-none cursor-pointer hover:bg-[#D4AF37] transition-all uppercase">GABUNG SEKARANG</button>
      </div>
    </section>
  );
}

function ProductDetailView({ product, onBack, onBuy, onAddToCart, notify }) {
  const [selectedSize, setSelectedSize] = useState('All Size');
  const [selectedAge, setSelectedAge] = useState('1-2 Thn');
  const [currentPrice, setCurrentPrice] = useState(Number(product.price));
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = useMemo(() => {
    const list = product.imageURLs ? product.imageURLs.filter(url => url && url.trim() !== '') : [];
    if (list.length === 0 && product.imageURL) list.push(product.imageURL);
    return list;
  }, [product]);

  useEffect(() => {
    if (selectedSize && product.sizePrices && product.sizePrices[selectedSize]) {
      setCurrentPrice(Number(product.sizePrices[selectedSize]));
    } else {
      setCurrentPrice(Number(product.price));
    }
  }, [selectedSize, product]);

  const updateQuantity = (val) => {
    const newQty = quantity + val;
    if (newQty >= 1) setQuantity(newQty);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-bold uppercase text-black font-bold uppercase">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 mb-6 text-[10px] bg-transparent border-none cursor-pointer uppercase font-black hover:text-black transition-colors"><ChevronLeft size={16}/> Kembali</button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 font-bold uppercase">
        <div className="space-y-4 font-bold uppercase animate-in slide-in-from-left duration-500">
          <div className="aspect-[4/5] bg-zinc-50 rounded-3xl overflow-hidden shadow-md border border-zinc-100 font-bold">
            <img src={images[activeImg]} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar font-bold uppercase">
            {images.map((img, i) => (
              <div key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeImg === i ? 'border-[#D4AF37]' : 'border-transparent'}`}><img src={img} className="w-full h-full object-cover font-bold uppercase" /></div>
            ))}
          </div>
        </div>
        <div className="space-y-8 font-bold uppercase animate-in slide-in-from-right duration-500">
          <div className="font-bold uppercase">
            <h2 className="text-2xl md:text-4xl font-serif mb-2 font-black uppercase tracking-tight">{product.name}</h2>
            <div className="flex items-center gap-2 mb-4 font-bold uppercase"><Star className="text-yellow-400 fill-yellow-400" size={14}/> <Star className="text-yellow-400 fill-yellow-400" size={14}/> <Star className="text-yellow-400 fill-yellow-400" size={14}/> <Star className="text-yellow-400 fill-yellow-400" size={14}/> <Star className="text-yellow-400 fill-yellow-400" size={14}/> <span className="text-xs text-zinc-400 font-black uppercase">(2)</span></div>
            <p className="text-3xl font-black text-[#D4AF37] uppercase">{formatIDR(currentPrice)}</p>
          </div>
          
          {product.showAgeSelection !== false && (
            <div className="space-y-4 font-bold uppercase">
              <label className="text-[10px] text-zinc-400 font-black tracking-widest font-bold uppercase">PILIH UMUR</label>
              <div className="flex flex-wrap gap-2 font-bold uppercase">
                {AGE_OPTIONS.map(age => (
                  <button key={age} onClick={() => setSelectedAge(age)} className={`px-4 py-2 text-[10px] border rounded-lg transition-all cursor-pointer font-black uppercase ${selectedAge === age ? 'bg-black text-[#D4AF37] border-black' : 'bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300'}`}>{age}</button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 font-bold uppercase">
            <label className="text-[10px] text-zinc-400 font-black tracking-widest uppercase font-bold uppercase">PILIH UKURAN</label>
            <div className="flex flex-wrap gap-2 font-bold uppercase">
              {SIZE_OPTIONS.map(sz => (
                <button key={sz} onClick={() => setSelectedSize(sz)} className={`w-12 h-12 text-[10px] border rounded-lg transition-all cursor-pointer font-black uppercase ${selectedSize === sz ? 'bg-black text-[#D4AF37] border-black' : 'bg-white border-zinc-100 text-zinc-500'}`}>{sz}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4 font-bold uppercase">
             <label className="text-[10px] text-zinc-400 font-black tracking-widest uppercase font-bold uppercase">JUMLAH STOK</label>
             <div className="flex items-center gap-1 border border-zinc-200 rounded-lg w-fit overflow-hidden">
                <button onClick={() => updateQuantity(-1)} className="px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-all border-none cursor-pointer text-zinc-600"><Minus size={14}/></button>
                <div className="w-12 text-center text-xs font-black font-sans">{quantity}</div>
                <button onClick={() => updateQuantity(1)} className="px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-all border-none cursor-pointer text-zinc-600"><Plus size={14}/></button>
             </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 font-bold uppercase">
            <button onClick={() => onBuy(selectedSize, selectedAge, currentPrice, quantity)} className="bg-[#10b981] text-white py-4 rounded-xl font-black text-[11px] border-none cursor-pointer shadow-lg active:scale-95 transition-all uppercase hover:brightness-105">BELI SEKARANG</button>
            <button onClick={() => onAddToCart({...product, chosenSize: selectedSize, chosenAge: selectedAge, chosenPrice: currentPrice, quantity})} className="bg-white border border-zinc-200 py-3 rounded-xl font-black text-[10px] cursor-pointer hover:bg-zinc-50 transition-all font-bold uppercase uppercase">TAMBAH KE KERANJANG</button>
          </div>

          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4 font-bold uppercase">
            <h4 className="text-xs font-black border-b border-zinc-200 pb-2 font-bold uppercase">MATERIAL :</h4>
            <p className="text-xs text-zinc-600 leading-relaxed font-serif italic whitespace-pre-wrap font-black uppercase">{product.description || "Setiap jahitan mencerminkan dedikasi butik kami."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutWizard({ product, rekening, shippingMethods, onComplete, onBack, notify }) {
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [localProofBase64, setLocalProofBase64] = useState(null);
  const [shipping, setShipping] = useState({ email: '', newsletter: true, name: '', city: '', address: '', postalCode: '', phone: '', dropship: false });
  const [selectedCourier, setSelectedCourier] = useState(shippingMethods[0] || DEFAULT_SHIPPING[0]);
  const [payment, setPayment] = useState({ invoice: `INV-DEVI-${Math.floor(Date.now() / 1000).toString().slice(-6)}`, transferTo: '', bankAsal: '', senderName: '', status: 'Belum Dibayar' });

  const qty = product.quantity || 1;
  const subtotal = Number(product.chosenPrice || product.price) * qty;
  const total = subtotal + (selectedCourier?.price || 0);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) return notify("Maksimal file 8MB!", "error");
      const compressed = await compressImage(file, 1024);
      setLocalProofBase64(compressed);
      notify("Bukti Transfer Siap!", "success");
    }
  };

  const submitOrder = async () => {
    if(!payment.transferTo || !payment.bankAsal || !payment.senderName || !localProofBase64) return notify("Lengkapi formulir pembayaran!", "error");
    setSending(true);
    try {
      const orderRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      await addDoc(orderRef, {
        ...payment, ...shipping,
        productName: product.name, productSize: product.chosenSize, productAge: product.chosenAge,
        quantity: qty, subtotal, courier: selectedCourier.name, shippingFee: selectedCourier.price, total,
        proofImage: localProofBase64, createdAt: serverTimestamp()
      });
      setStep(5);
    } catch(e) { notify("Gagal mengirim pesanan.", "error"); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 font-bold uppercase text-black font-bold uppercase">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start font-bold uppercase font-bold uppercase">
        <div className="lg:col-span-2 space-y-8 font-bold uppercase font-bold uppercase">
          <div className="flex gap-4 text-[10px] text-zinc-400 mb-8 font-bold uppercase">
            <span className={step >= 1 ? 'text-black font-black' : ''}>Info Pembeli</span> <ChevronRight size={14}/>
            <span className={step >= 2 ? 'text-black font-black' : ''}>Kurir</span> <ChevronRight size={14}/>
            <span className={step >= 3 ? 'text-black font-black' : ''}>Bayar</span>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-left font-bold uppercase">
              <input className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-black uppercase" placeholder="Email" value={shipping.email} onChange={e=>setShipping({...shipping, email:e.target.value})}/>
              <input className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-black uppercase" placeholder="Nama Lengkap" value={shipping.name} onChange={e=>setShipping({...shipping, name:e.target.value})}/>
              <input className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-black uppercase" placeholder="Kota" value={shipping.city} onChange={e=>setShipping({...shipping, city:e.target.value})}/>
              <textarea className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none h-24 font-black uppercase" placeholder="Alamat Lengkap" value={shipping.address} onChange={e=>setShipping({...shipping, address:e.target.value})}/>
              <div className="grid grid-cols-2 gap-4 font-bold uppercase">
                <input className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-black uppercase" placeholder="Kode Pos" value={shipping.postalCode} onChange={e=>setShipping({...shipping, postalCode:e.target.value})}/>
                <input className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-black uppercase" placeholder="Nomor Telepon" value={shipping.phone} onChange={e=>setShipping({...shipping, phone:e.target.value})}/>
              </div>
              <button onClick={()=>setStep(2)} className="w-full md:w-auto bg-black text-[#D4AF37] px-12 py-4 rounded-xl font-black uppercase shadow-lg active:scale-95 transition-all">LANJUTKAN</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-left font-bold uppercase font-bold uppercase">
              <h3 className="text-xl font-serif uppercase font-black">Pilih Kurir</h3>
              {shippingMethods.map(m => (
                <div key={m.id} onClick={()=>setSelectedCourier(m)} className={`p-5 rounded-2xl border-2 cursor-pointer flex justify-between items-center transition-all font-black uppercase ${selectedCourier?.id === m.id ? 'border-black bg-zinc-50 shadow-sm' : 'border-zinc-100 hover:border-zinc-300'}`}>
                  <div className="flex items-center gap-4 font-bold uppercase">
                    <div className="w-16 h-12 bg-white p-1 rounded-lg border border-zinc-100 flex items-center justify-center overflow-hidden font-bold uppercase">
                      <img src={m.logo} className="w-full h-full object-contain" alt={m.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/150x100?text=LOGO'; }} />
                    </div>
                    <span className="font-black uppercase text-xs">{m.name}</span>
                  </div>
                  <span className="font-black text-sm">{formatIDR(m.price)}</span>
                </div>
              ))}
              <div className="flex gap-2 pt-4 font-bold uppercase">
                <button onClick={()=>setStep(1)} className="px-8 py-4 bg-zinc-100 rounded-xl font-black uppercase transition-all hover:bg-zinc-200">KEMBALI</button>
                <button onClick={()=>setStep(3)} className="flex-1 bg-black text-[#D4AF37] py-4 rounded-xl font-black uppercase shadow-lg active:scale-95 transition-all">LANJUTKAN</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in zoom-in font-bold uppercase font-bold uppercase">
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-4 font-bold uppercase">
                <h3 className="text-xl font-serif uppercase font-black">Invoice #{payment.invoice}</h3>
                <div className="flex justify-between border-t pt-4 font-black"><span>Total Tagihan</span><span className="text-xl font-black">{formatIDR(total)}</span></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-bold uppercase font-bold uppercase">
                {rekening.map(rek => (
                  <div key={rek.id} onClick={()=>setPayment({...payment, transferTo: `${rek.bankName} - ${rek.accountNumber} - ${rek.accountHolder}`})} className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all font-bold uppercase ${payment.transferTo.includes(rek.accountNumber) ? 'border-black bg-zinc-100' : 'border-zinc-100'}`}>
                    <img 
                        src={BANK_LOGOS[rek.bankName]} 
                        className="h-8 object-contain font-bold uppercase" 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100x60?text=BANK'; }} 
                    />
                    <p className="text-sm text-center font-black uppercase">{rek.bankName}</p>
                    <p className="text-xl font-mono font-black tracking-tighter">{rek.accountNumber}</p>
                  </div>
                ))}
              </div>
              <button onClick={()=>setStep(4)} className="w-full bg-[#10b981] text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all">KONFIRMASI PEMBAYARAN</button>

              <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100 space-y-4 animate-in fade-in duration-500">
                <h4 className="text-[10px] text-zinc-400 font-black tracking-[0.2em] uppercase">Kirim ke :</h4>
                <div className="space-y-1.5">
                  <p className="font-black text-zinc-950 text-base uppercase leading-none">{shipping.name}</p>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase leading-relaxed">{shipping.address}</p>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase">{shipping.city}, {shipping.postalCode}</p>
                  <p className="text-[11px] text-zinc-950 font-black">HP: {shipping.phone}</p>
                  <div className="pt-3 border-t border-zinc-200 mt-3 flex items-center gap-2">
                    <Truck size={12} className="text-[#D4AF37]" />
                    <p className="text-[10px] text-zinc-900 font-black italic uppercase tracking-wider">{selectedCourier?.name}</p>
                  </div>
                  <p className="text-[10px] text-zinc-300 italic pt-2 font-bold">Menunggu Untuk Dikirim</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in zoom-in font-bold uppercase">
              <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl border shadow-xl space-y-6">
                <h3 className="text-2xl font-serif text-center uppercase font-black">Konfirmasi Transfer</h3>
                <input className="w-full p-4 bg-zinc-50 rounded-xl border-none font-black uppercase outline-none focus:ring-1 focus:ring-black" placeholder="Bank Asal (BCA/DANA/dll)" value={payment.bankAsal} onChange={e=>setPayment({...payment, bankAsal: e.target.value})}/>
                <input className="w-full p-4 bg-zinc-50 rounded-xl border-none font-black uppercase outline-none focus:ring-1 focus:ring-black" placeholder="Nama Pemilik Akun" value={payment.senderName} onChange={e=>setPayment({...payment, senderName: e.target.value})}/>
                <div onClick={()=>document.getElementById('uPf').click()} className="w-full h-32 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden bg-zinc-50 transition-all hover:bg-zinc-100 font-bold uppercase">
                  {localProofBase64 ? <img src={localProofBase64} className="w-full h-full object-cover font-bold uppercase"/> : <div className="text-center font-bold uppercase"><Upload size={24} className="mx-auto mb-2 text-zinc-400"/><span className="text-zinc-400 text-[10px] font-black">Upload Bukti TF (Maks 8MB)</span></div>}
                  <input type="file" id="uPf" className="hidden" accept="image/*" onChange={handleFileSelect}/>
                </div>
                <button onClick={submitOrder} disabled={sending} className="w-full bg-black text-[#D4AF37] py-5 rounded-2xl font-black flex items-center justify-center gap-2 uppercase shadow-xl active:scale-95 transition-all">
                  {sending ? <Loader2 className="animate-spin" /> : 'KIRIM PESANAN SEKARANG'}
                </button>
              </div>

              {/* SUMMARY IN STEP 4 FOR FINAL VERIFICATION */}
              <div className="max-w-lg mx-auto bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-3">
                <h4 className="text-[9px] text-zinc-400 font-black uppercase">Detail Pengiriman :</h4>
                <p className="text-[11px] font-black">{shipping.name} | {shipping.phone}</p>
                <p className="text-[10px] text-zinc-500 leading-tight uppercase">{shipping.address}, {shipping.city}</p>
                <p className="text-[10px] font-black text-[#D4AF37] uppercase">Kurir: {selectedCourier?.name}</p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-20 animate-in zoom-in font-bold uppercase font-bold uppercase">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100 font-bold"><SuccessIcon size={40}/></div>
              <h3 className="text-3xl font-serif uppercase font-black">Terima Kasih</h3>
              <p className="text-zinc-500 mb-8 uppercase font-black font-bold uppercase">Pesanan Anda telah kami terima.</p>
              <button onClick={onComplete} className="px-12 py-4 bg-black text-[#D4AF37] rounded-full font-black uppercase shadow-lg active:scale-95 transition-all">KEMBALI KE TOKO</button>
            </div>
          )}
        </div>

        {step < 5 && (
          <aside className="bg-white border rounded-3xl p-6 shadow-sm sticky top-24 font-bold uppercase font-bold uppercase">
            <h4 className="text-xs font-black mb-4 uppercase flex items-center gap-2 font-bold uppercase"><ShoppingBag size={14}/> Ringkasan Bag</h4>
            <div className="flex gap-4 mb-4 font-bold uppercase">
              <img src={product.imageURLs?.[0] || product.imageURL} className="w-16 h-20 rounded-xl object-cover shadow-sm font-bold uppercase" />
              <div className="text-[10px] space-y-1 font-bold uppercase flex-1 font-bold uppercase">
                <p className="font-black uppercase leading-tight font-bold">{product.name}</p>
                <p className="text-zinc-400 uppercase font-black">Umur: {product.chosenAge}</p>
                <p className="text-zinc-400 uppercase font-black">Size: {product.chosenSize}</p>
                <p className="text-zinc-400 uppercase font-black">Jumlah: {qty}x</p>
                <p className="font-black text-[#D4AF37] font-bold">{formatIDR(subtotal)}</p>
              </div>
            </div>
            <div className="border-t pt-4 text-[10px] space-y-2 uppercase font-bold font-bold uppercase">
              <div className="flex justify-between text-zinc-500 uppercase font-black font-bold uppercase"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
              <div className="flex justify-between text-zinc-500 uppercase font-black font-bold uppercase"><span>Biaya Pengiriman</span><span>{formatIDR(selectedCourier?.price || 0)}</span></div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-zinc-100 text-black font-black uppercase"><span>TOTAL</span><span>{formatIDR(total)}</span></div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({ products, orders, rekening, shippingMethods, appId, onLogout, notify, creds }) {
  const [tab, setTab] = useState('inventory');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [instaUrls, setInstaUrls] = useState(['', '', '', '', '']);
  const [galleryImages, setGalleryImages] = useState([null, null, null, null, null]);
  const [formData, setFormData] = useState({ 
    imageURLs: [], name: '', price: '', description: '', sizes: SIZE_OPTIONS, sizePrices: {}, showAgeSelection: true
  });
  const [newCreds, setNewCreds] = useState({ username: creds?.username || '', password: creds?.password || '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [localShipping, setLocalShipping] = useState(shippingMethods);
  
  const resetForm = () => {
    setEditingId(null);
    setFormData({ imageURLs: [], name: '', price: '', description: '', sizes: SIZE_OPTIONS, sizePrices: {}, showAgeSelection: true });
    setInstaUrls(['', '', '', '', '']);
    setGalleryImages([null, null, null, null, null]);
  };

  const handleGalleryFileSelect = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      notify(`Memproses foto ${index + 1}...`);
      const compressed = await compressImage(file, 1024);
      const newList = [...galleryImages];
      newList[index] = compressed;
      setGalleryImages(newList);
      notify(`Foto ${index + 1} Siap!`, "success");
    }
  };

  const publishProduct = async () => {
    const validInsta = instaUrls.filter(url => url && url.trim() !== '');
    const validGallery = galleryImages.filter(img => img !== null);
    const allImages = [...validInsta, ...validGallery];

    if (!formData.name.trim()) return notify("Masukkan nama produk!", "error");
    if (!formData.price) return notify("Masukkan harga produk!", "error");
    if (allImages.length === 0) return notify("Unggah minimal 1 foto!", "error");
    
    setSaving(true);
    try {
      const data = { 
        ...formData, 
        imageURLs: allImages, 
        price: Number(formData.price), 
        updatedAt: serverTimestamp() 
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', editingId), data);
        notify("Berhasil diperbarui.", "success");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), { ...data, createdAt: serverTimestamp() });
        notify("Katalog berhasil diterbitkan.", "success");
      }
      resetForm();
    } catch(e) { 
      notify("Kesalahan: " + e.message, "error"); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleFetchImage = (url, index) => {
    if (!url) return;
    const clean = url.split('?')[0]; 
    const finalUrl = `https://images.weserv.nl/?url=${encodeURIComponent(clean.endsWith('/') ? clean + 'media/?size=l' : clean + '/media/?size=l')}&w=1000&output=jpg`;
    const newUrls = [...instaUrls];
    newUrls[index] = finalUrl;
    setInstaUrls(newUrls);
    notify(`Foto IG ${index+1} OK.`);
  };

  const updateAdminAuth = async () => {
    if (!newCreds.username || !newCreds.password) return notify("Username & Password wajib diisi!", "error");
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admin_settings', 'main'), newCreds);
      notify("Profil admin diperbarui.", "success");
    } catch(e) { notify("Gagal memperbarui profil.", "error"); }
  };

  const addBank = async (e) => {
    e.preventDefault();
    const bankName = e.target.bankName.value;
    const accountNumber = e.target.accountNumber.value;
    const accountHolder = e.target.accountHolder.value;
    if (!accountNumber || !accountHolder) return notify("Data tidak lengkap!", "error");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rekening'), { bankName, accountNumber, accountHolder });
      notify("Rekening ditambahkan.", "success");
      e.target.reset();
    } catch(e) { notify(e.message, "error"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 font-bold uppercase text-black font-bold uppercase font-bold">
      {selectedOrder && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in font-bold uppercase font-bold">
            <div className="p-5 bg-zinc-950 text-[#D4AF37] flex justify-between items-center font-black uppercase font-bold uppercase">
              <h3 className="text-[10px] tracking-widest uppercase font-black">DETAIL PESANAN</h3>
              <button onClick={()=>setSelectedOrder(null)} className="p-2 bg-white/10 rounded-full text-white border-none cursor-pointer font-bold uppercase font-bold uppercase"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar text-black uppercase font-bold font-bold">
              <div className="grid grid-cols-2 gap-4 text-[10px] border-b pb-4 font-black uppercase">
                <div><p className="text-zinc-400 uppercase font-black">Pembeli</p><p className="font-black">{selectedOrder.name}</p></div>
                <div><p className="text-zinc-400 uppercase font-black">Nomor HP</p><p className="font-black text-green-600">{selectedOrder.phone || '-'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[10px] border-b pb-4 font-black uppercase">
                <div><p className="text-zinc-400 uppercase font-black">Item</p><p className="font-black">{selectedOrder.productName} ({selectedOrder.quantity}x)</p></div>
                <div><p className="text-zinc-400 uppercase font-black">Ekspedisi</p><p className="font-black text-[#D4AF37]">{selectedOrder.courier || '-'}</p></div>
              </div>
              <div className="text-[10px] bg-zinc-50 p-4 rounded-xl font-black uppercase">
                <p className="text-zinc-400 mb-1 uppercase font-black">Alamat Lengkap</p>
                <p className="font-black uppercase leading-relaxed">{selectedOrder.address}, {selectedOrder.city} ({selectedOrder.postalCode})</p>
              </div>
              <div className="p-4 border rounded-xl bg-zinc-50">
                <p className="text-[8px] text-zinc-400 mb-2 uppercase font-black">Bukti Pembayaran</p>
                <img src={selectedOrder.proofImage} className="w-full rounded-2xl shadow-md cursor-pointer font-bold uppercase" onClick={()=>window.open(selectedOrder.proofImage, '_blank')} />
              </div>
              <div className="flex gap-2 font-bold uppercase">
                <button onClick={()=>setSelectedOrder(null)} className="flex-1 bg-zinc-100 py-4 rounded-xl text-[10px] font-black uppercase font-bold uppercase font-bold uppercase">TUTUP</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className="md:w-60 space-y-4 font-bold uppercase font-bold uppercase font-bold uppercase font-bold">
        <div className="bg-zinc-950 p-6 rounded-3xl text-white shadow-xl flex items-center gap-3 font-bold uppercase font-bold uppercase">
          <Crown className="text-[#D4AF37]" size={28}/> <h2 className="text-sm font-serif italic uppercase font-black uppercase">Maison Admin</h2>
        </div>
        <div className="bg-white p-3 rounded-2xl border flex flex-col gap-1 shadow-sm font-bold uppercase font-bold uppercase font-bold">
          {['stok', 'pesanan', 'perbankan', 'pengiriman', 'pengaturan'].map(t => (
            <button key={t} onClick={()=>setTab(t === 'stok' ? 'inventory' : t === 'pesanan' ? 'orders' : t === 'perbankan' ? 'banking' : t === 'pengiriman' ? 'shipping' : 'settings')} className={`text-left px-5 py-3 rounded-xl text-[9px] tracking-widest transition-all font-black uppercase font-bold uppercase ${((t === 'stok' && tab === 'inventory') || (t === 'pesanan' && tab === 'orders') || (t === 'perbankan' && tab === 'banking') || (t === 'pengiriman' && tab === 'shipping') || (t === 'pengaturan' && tab === 'settings')) ? 'bg-black text-[#D4AF37]' : 'text-zinc-400 bg-transparent'}`}>{t.toUpperCase()}</button>
          ))}
          <button onClick={onLogout} className="text-left px-5 py-3 rounded-xl text-[9px] text-red-500 bg-transparent font-black uppercase font-bold">LOGOUT</button>
        </div>
      </aside>

      <div className="flex-1 bg-white p-6 rounded-3xl border min-h-[60vh] shadow-sm font-bold uppercase text-black font-bold uppercase font-bold uppercase">
        {tab === 'inventory' && (
          <div className="space-y-10 font-bold uppercase font-bold uppercase">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-b pb-10 font-bold uppercase">
              <div className="space-y-6 font-bold uppercase font-bold">
                <div className="space-y-3 font-bold uppercase font-bold uppercase font-bold">
                  <h4 className="text-[10px] font-black tracking-widest text-[#D4AF37] flex items-center gap-2 uppercase font-black font-bold uppercase font-bold">
                    <ImageIcon size={14}/> UNGGAH GALERI (HP)
                  </h4>
                  <div className="grid grid-cols-3 gap-3 font-bold uppercase font-bold uppercase">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} onClick={()=>document.getElementById(`gal-${idx}`).click()} className="aspect-square bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-zinc-100 transition-all font-bold uppercase font-bold uppercase">
                        {img ? (
                          <img src={img} className="w-full h-full object-cover font-bold" />
                        ) : (
                          <div className="text-center opacity-30 font-bold uppercase">
                            <Plus size={20} className="mx-auto mb-1 font-black"/>
                            <p className="text-[7px] uppercase font-black uppercase">FOTO {idx+1}</p>
                          </div>
                        )}
                        <input type="file" id={`gal-${idx}`} className="hidden" accept="image/*" onChange={(e)=>handleGalleryFileSelect(e, idx)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 font-bold uppercase">
                  <h4 className="text-[10px] font-black tracking-widest text-zinc-400 flex items-center gap-2 uppercase font-black">
                    <Instagram size={14}/> LINK INSTAGRAM
                  </h4>
                  {instaUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center font-bold uppercase">
                      <input className="flex-1 bg-zinc-50 p-3 rounded-xl border-none text-[8px] font-black uppercase" placeholder={`Link Instagram ${idx+1}`} value={url} onChange={e=>{const nu=[...instaUrls];nu[idx]=e.target.value;setInstaUrls(nu);}}/>
                      <button onClick={()=>handleFetchImage(instaUrls[idx], idx)} className="bg-black text-[#D4AF37] px-3 py-2 rounded-xl text-[7px] font-black uppercase font-bold uppercase">FETCH</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 font-bold uppercase font-bold uppercase">
                <div className="flex justify-between items-center font-bold uppercase font-bold uppercase font-bold">
                  <h3 className="text-xs font-serif italic uppercase font-black font-bold uppercase">Publikasi Maison</h3> 
                  {editingId && <button onClick={resetForm} className="text-[8px] bg-zinc-100 px-3 py-1 rounded-full uppercase font-black font-bold">Batal</button>}
                </div>
                
                <input className="w-full bg-zinc-50 p-4 rounded-xl text-[10px] font-black outline-none uppercase font-bold uppercase" placeholder="Judul Katalog" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                <input type="number" className="w-full bg-zinc-50 p-4 rounded-xl text-[10px] font-black outline-none uppercase font-bold uppercase" placeholder="Harga Dasar (IDR)" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                
                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100 font-bold uppercase font-bold uppercase">
                  <div>
                    <h4 className="text-[10px] font-black uppercase font-bold uppercase">Pilihan Umur</h4>
                    <p className="text-[8px] text-zinc-400 uppercase font-black">Aktifkan untuk koleksi anak</p>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, showAgeSelection: !formData.showAgeSelection})}
                    className={`p-1 rounded-full transition-all border-none cursor-pointer font-bold ${formData.showAgeSelection ? 'text-green-500' : 'text-zinc-300'}`}
                  >
                    {formData.showAgeSelection ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
                  </button>
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl space-y-3 font-bold uppercase font-bold uppercase font-bold uppercase font-bold">
                   <p className="text-[8px] font-black text-zinc-500 uppercase font-bold uppercase">Harga Per Size (Opsional)</p>
                   <div className="grid grid-cols-2 gap-2 font-bold uppercase">
                      {SIZE_OPTIONS.map(sz => (
                        <div key={sz} className="flex items-center gap-2 font-bold uppercase font-bold uppercase">
                           <span className="text-[8px] w-12 font-black uppercase">{sz}</span>
                           <input type="number" className="flex-1 p-2 bg-white rounded-lg text-[8px] font-black uppercase font-bold uppercase" placeholder="IDR" value={formData.sizePrices[sz] || ''} onChange={e=>setFormData({...formData, sizePrices: {...formData.sizePrices, [sz]:e.target.value}})}/>
                        </div>
                      ))}
                   </div>
                </div>
                <textarea className="w-full bg-zinc-50 p-4 rounded-xl text-[10px] font-black h-24 outline-none resize-none uppercase font-bold uppercase font-bold uppercase" placeholder="Cerita Material..." value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/>
                <button onClick={publishProduct} disabled={saving} className="w-full bg-black text-[#D4AF37] py-5 rounded-2xl font-black text-[10px] shadow-lg tracking-widest uppercase font-bold uppercase font-bold"> {saving ? 'MEMPUBLIKASIKAN...' : 'SIMPAN SEKARANG'} </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-bold uppercase font-bold uppercase">
              {products.map(p => (
                <div key={p.id} className="border rounded-xl overflow-hidden relative group font-bold uppercase font-bold">
                  <img src={p.imageURLs?.[0] || p.imageURL} className="aspect-[3/4] w-full object-cover font-bold" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 font-bold uppercase">
                    <button onClick={()=>{
                      setEditingId(p.id); 
                      setFormData({...p, showAgeSelection: p.showAgeSelection ?? true});
                      
                      const existingImages = p.imageURLs || [];
                      const newInsta = ['', '', '', '', ''];
                      const newGallery = [null, null, null, null, null];
                      let gIdx = 0; let iIdx = 0;
                      
                      existingImages.forEach(url => {
                        if (url.startsWith('data:image')) {
                          if (gIdx < 5) newGallery[gIdx++] = url;
                        } else {
                          if (iIdx < 5) newInsta[iIdx++] = url;
                        }
                      });
                      
                      setInstaUrls(newInsta);
                      setGalleryImages(newGallery);

                      setTab('inventory'); 
                      window.scrollTo(0,0);
                    }} className="p-2 bg-white rounded-full text-black font-black uppercase font-bold uppercase"><Edit size={16}/></button>
                    <button onClick={async()=>{if(confirm('Hapus produk?')) await deleteDoc(doc(db,'artifacts',appId,'public', 'data', 'products',p.id));}} className="p-2 bg-red-500 text-white rounded-full font-black uppercase font-bold"><Trash2 size={16}/></button>
                  </div>
                  <div className="p-2 bg-white font-bold uppercase font-bold uppercase"><p className="text-[8px] font-black truncate uppercase font-bold">{p.name}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-4 font-bold uppercase font-bold">
            <h3 className="text-xs font-serif italic border-b pb-2 uppercase font-black uppercase font-bold">Daftar Pesanan Masuk</h3>
            {orders.map(o => (
              <div key={o.id} onClick={()=>setSelectedOrder(o)} className="p-4 bg-zinc-50 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-zinc-100 transition-all font-bold">
                <div className="flex items-center gap-4 font-bold uppercase font-bold">
                   <img src={o.proofImage} className="w-10 h-14 rounded-lg object-cover font-bold uppercase font-bold" />
                   <div className="font-bold">
                     <span className={`text-[7px] px-2 py-0.5 rounded-full uppercase font-black font-bold uppercase ${o.status === 'Belum Dibayar' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>{o.status}</span>
                     <p className="text-[10px] font-black uppercase font-bold">{o.name}</p>
                     <p className="text-[9px] text-[#D4AF37] font-black uppercase font-bold">{formatIDR(o.total)}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[8px] text-zinc-400 font-bold uppercase">{o.courier}</p>
                  <button onClick={async(e)=>{e.stopPropagation(); if(confirm('Hapus order?')) await deleteDoc(doc(db,'artifacts',appId,'public','data','orders',o.id));}} className="text-zinc-300 hover:text-red-500 bg-transparent border-none cursor-pointer font-black font-bold uppercase"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'banking' && (
          <div className="space-y-8 font-bold uppercase font-bold font-bold uppercase">
            <div className="bg-zinc-50 p-6 rounded-3xl space-y-4 font-bold uppercase shadow-inner font-bold uppercase font-bold">
              <h3 className="text-xs font-serif italic uppercase font-black font-bold">Tambah Rekening / E-Wallet</h3>
              <form onSubmit={addBank} className="space-y-4 font-bold uppercase font-bold uppercase">
                <select name="bankName" className="w-full p-4 bg-white rounded-xl text-[10px] font-black uppercase font-bold outline-none">
                  {Object.keys(BANK_LOGOS).map(n => <option key={n} value={n}>{n.toUpperCase()}</option>)}
                </select>
                <input name="accountNumber" className="w-full p-4 bg-white rounded-xl text-[10px] font-black uppercase font-bold outline-none" placeholder="Nomor Rekening / ID"/>
                <input name="accountHolder" className="w-full p-4 bg-white rounded-xl text-[10px] font-black uppercase font-bold outline-none" placeholder="Atas Nama"/>
                <button type="submit" className="w-full bg-black text-[#D4AF37] py-4 rounded-xl font-black text-[9px] uppercase font-bold uppercase font-bold">TAMBAH METODE</button>
              </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-bold uppercase font-bold uppercase font-bold">
              {rekening.map(rek => (
                <div key={rek.id} className="p-4 border rounded-2xl flex justify-between items-center shadow-sm font-bold uppercase font-bold">
                  <div className="flex items-center gap-3 font-bold uppercase font-bold">
                    <img src={BANK_LOGOS[rek.bankName]} className="h-4 w-10 object-contain font-bold uppercase font-bold"/>
                    <div className="text-[9px] font-bold uppercase font-bold font-bold uppercase font-bold">
                      <p className="font-black">{rek.accountNumber}</p>
                      <p className="text-zinc-400 uppercase font-black font-bold font-bold uppercase">A.N {rek.accountHolder}</p>
                    </div>
                  </div>
                  <button onClick={async()=>await deleteDoc(doc(db,'artifacts',appId,'public','data','rekening',rek.id))} className="text-red-500 border-none bg-transparent cursor-pointer font-black font-bold uppercase font-bold"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'shipping' && (
          <div className="space-y-6 uppercase font-bold uppercase font-bold uppercase font-bold uppercase">
             <h3 className="text-xs font-serif italic border-b pb-2 uppercase font-black uppercase font-bold uppercase">Ubah Tarif Ongkir</h3>
             <div className="bg-zinc-50 p-8 rounded-3xl space-y-4 font-bold uppercase font-bold uppercase">
                {localShipping.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border font-bold uppercase font-bold">
                     <div className="w-16 h-10 bg-white p-1 rounded-lg border border-zinc-100 flex items-center justify-center overflow-hidden font-bold uppercase font-bold">
                       <img src={m.logo} className="w-full h-full object-contain font-bold uppercase" alt={m.name} />
                     </div>
                     <span className="flex-1 text-[10px] font-black uppercase font-bold uppercase font-bold">{m.name}</span>
                     <div className="flex items-center gap-2 font-bold uppercase font-bold">
                        <span className="text-[9px] text-zinc-400 uppercase font-black font-bold uppercase">Rp</span>
                        <input 
                          type="number" 
                          className="w-24 p-2 bg-zinc-50 rounded-lg text-[10px] font-black uppercase font-bold uppercase" 
                          value={m.price} 
                          onChange={(e) => {
                            const newList = [...localShipping];
                            newList[idx].price = Number(e.target.value);
                            setLocalShipping(newList);
                          }} 
                        />
                     </div>
                  </div>
                ))}
                <button onClick={async()=>{
                   await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shipping_config', 'methods'), { list: localShipping });
                   notify("Tarif telah disimpan.", "success");
                }} className="w-full bg-black text-[#D4AF37] py-4 rounded-xl font-black text-[9px] mt-4 shadow-xl uppercase font-bold uppercase font-bold">UPDATE TARIF</button>
             </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-md space-y-6 font-bold uppercase font-bold uppercase">
            <h3 className="text-xs font-serif italic border-b pb-2 uppercase font-black uppercase font-bold uppercase">Pengaturan Akses</h3>
            <div className="bg-zinc-50 p-8 rounded-3xl space-y-6 shadow-inner font-bold uppercase font-bold uppercase">
              <div className="space-y-1 font-bold uppercase font-bold uppercase">
                <label className="text-[9px] text-zinc-400 uppercase font-black uppercase font-bold uppercase">Nama Pengguna Login Baru</label>
                <input className="w-full p-4 rounded-xl border-none text-[10px] font-black uppercase font-bold uppercase" value={newCreds.username} onChange={e=>setNewCreds({...newCreds, username:e.target.value})}/>
              </div>
              <div className="space-y-1 font-bold uppercase font-bold uppercase">
                <label className="text-[9px] text-zinc-400 uppercase font-black uppercase font-bold uppercase">Kata Sandi Login Baru</label>
                <input className="w-full p-4 rounded-xl border-none text-[10px] font-black uppercase font-bold uppercase" type="password" value={newCreds.password} onChange={e=>setNewCreds({...newCreds, password:e.target.value})}/>
              </div>
              <button onClick={updateAdminAuth} className="w-full bg-black text-[#D4AF37] py-4 rounded-xl font-black text-[9px] shadow-lg uppercase font-bold uppercase font-bold uppercase">UPDATE PROFIL ADMIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminLogin({ creds, onLoginSuccess, onBack, notify }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const handleLogin = (e) => {
    e.preventDefault();
    if (u.trim().toLowerCase() === (creds?.username || 'admin').toLowerCase() && p === (creds?.password || 'admin123')) {
      onLoginSuccess(); notify("Login berhasil.", "success");
    } else { notify("Akses ditolak!", "error"); }
  };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in font-bold uppercase text-black font-bold font-bold uppercase">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-12 relative shadow-2xl border border-[#D4AF37]/20 font-bold uppercase font-bold uppercase font-bold">
        <button onClick={onBack} className="absolute top-8 right-8 text-zinc-300 bg-transparent border-none cursor-pointer font-black uppercase font-bold uppercase"><X size={24}/></button>
        <div className="text-center mb-10 space-y-4 font-bold uppercase font-bold uppercase">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto text-[#D4AF37] shadow-inner font-bold uppercase font-bold uppercase"><Lock size={32}/></div>
          <h3 className="text-xl font-serif font-black uppercase tracking-widest font-bold uppercase font-bold">Maison Portal</h3>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 font-bold uppercase font-bold uppercase">
          <input placeholder="ID Admin" value={u} onChange={e=>setU(e.target.value)} className="w-full bg-zinc-50 p-4 rounded-xl border-none text-[11px] font-black uppercase font-bold uppercase"/>
          <input type="password" placeholder="Pass-Key" value={p} onChange={e=>setP(e.target.value)} className="w-full bg-zinc-50 p-4 rounded-xl border-none text-[11px] font-black uppercase font-bold uppercase"/>
          <button type="submit" className="w-full bg-black text-[#D4AF37] py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl font-black uppercase font-bold uppercase">AUTHORIZE ACCESS</button>
        </form>
      </div>
    </div>
  );
}

function NotificationItem({ notification }) {
  const { message, type } = notification;
  return (
    <div className={`p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-5 backdrop-blur-md flex items-center gap-3 font-bold uppercase pointer-events-auto font-bold uppercase font-bold uppercase font-bold ${type === 'success' ? 'bg-green-50/95 border-green-100 text-green-950 font-black uppercase' : type === 'error' ? 'bg-red-50/95 border-red-100 text-red-950 font-black uppercase' : 'bg-white/95 border-zinc-100 text-black font-black uppercase'}`}>
      <div className={`p-2 rounded-lg shadow-sm font-bold uppercase font-bold ${type === 'success' ? 'bg-green-400 text-white' : 'bg-zinc-900 text-[#D4AF37]'}`}>{type === 'success' ? <CheckIcon size={14}/> : <Bell size={14}/>}</div>
      <p className="text-[10px] font-black tracking-widest uppercase font-black uppercase font-bold">{message}</p>
    </div>
  );
}

function CartView({ items, onRemove, onCheckout }) {
  const total = items.reduce((s, i) => s + Number(i.chosenPrice || i.price) * (i.quantity || 1), 0);
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 font-bold uppercase text-black font-bold uppercase font-bold uppercase font-bold uppercase font-bold">
       <div className="text-center mb-12 space-y-2 animate-in slide-in-from-bottom font-bold uppercase font-bold uppercase font-bold">
          <h2 className="text-4xl font-serif italic uppercase font-black uppercase font-bold font-bold uppercase">Maison <span className="text-[#D4AF37]">Bag</span></h2>
          <div className="w-12 h-[2px] bg-[#D4AF37] mx-auto opacity-40 font-bold uppercase font-bold"></div>
       </div>
       {items.length === 0 ? (
         <div className="text-center py-32 border-2 border-dashed border-zinc-100 rounded-[2.5rem] bg-zinc-50/30 flex flex-col items-center font-bold uppercase font-bold font-bold">
            <ShoppingBag size={64} className="text-zinc-100 mb-6 font-bold uppercase font-bold" />
            <p className="text-zinc-300 font-black text-[10px] tracking-widest uppercase font-black font-bold uppercase">Tas Kosong</p>
         </div>
       ) : (
         <div className="space-y-6 font-bold uppercase font-bold uppercase font-bold">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-white border border-zinc-100 rounded-3xl flex items-center justify-between gap-6 shadow-sm font-bold uppercase font-bold font-bold">
                 <div className="flex items-center gap-5 flex-1 font-bold uppercase font-bold uppercase font-bold uppercase">
                    <img src={item.imageURLs?.[0] || item.imageURL} className="w-20 h-24 rounded-2xl object-cover shadow-md border border-zinc-50 font-bold uppercase font-bold font-bold"/>
                    <div className="space-y-1.5 flex-1 font-bold uppercase font-bold font-bold uppercase font-bold uppercase">
                       <h4 className="text-[11px] font-serif font-bold uppercase tracking-tight text-zinc-800 font-black uppercase font-bold uppercase font-bold">{String(item.name).toUpperCase()}</h4>
                       <div className="flex gap-2 font-bold uppercase font-bold uppercase font-bold font-bold">
                          <span className="text-[7px] font-black px-2 py-0.5 bg-zinc-100 rounded-full border border-zinc-200 uppercase font-black font-bold">Umur {String(item.chosenAge)}</span>
                          <span className="text-[7px] font-black px-2 py-0.5 bg-zinc-100 rounded-full border border-zinc-200 uppercase font-black font-bold">Size {String(item.chosenSize)}</span>
                          <span className="text-[7px] font-black px-2 py-0.5 bg-black text-[#D4AF37] rounded-full uppercase font-black font-bold">{item.quantity || 1}x</span>
                       </div>
                       <p className="text-xs font-black text-black italic font-bold uppercase font-bold font-bold">{formatIDR(item.chosenPrice || item.price)}</p>
                    </div>
                 </div>
                 <button onClick={()=>onRemove(idx)} className="p-3 text-zinc-300 hover:text-red-500 bg-zinc-50 rounded-2xl border-none cursor-pointer font-black font-bold uppercase font-bold uppercase font-bold"><Trash2 size={18}/></button>
              </div>
            ))}
            <div className="pt-10 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-10 font-bold uppercase font-bold font-bold uppercase">
               <div className="text-center md:text-left space-y-0.5 font-bold uppercase font-bold uppercase font-bold">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest uppercase font-black uppercase font-bold">Total Harga</p>
                  <p className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter text-zinc-950 uppercase font-black font-bold font-bold">{formatIDR(total)}</p>
               </div>
               <button onClick={onCheckout} className="w-full md:w-auto bg-black text-[#D4AF37] px-16 py-6 rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl border-none cursor-pointer flex items-center justify-center gap-4 font-black uppercase font-bold uppercase">Checkout Sekarang <ArrowRight size={20} /></button>
            </div>
         </div>
       )}
    </div>
  );
}

function Footer({ setView, notify }) {
  return (
    <footer className="bg-[#030303] text-white pt-20 pb-10 px-6 border-t-[4px] border-[#D4AF37] font-bold uppercase">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="md:w-1/3 space-y-6">
           <h2 className="text-2xl font-serif font-black italic tracking-widest text-[#D4AF37] leading-none uppercase">DEVI OFFICIAL</h2>
           <p className="text-zinc-500 text-[10px] leading-relaxed italic opacity-70 font-black uppercase">Mengangkat standar fashion modest ke level kemewahan mutlak. Kemewahan abadi berawal dari tanggung jawab sosial dalam setiap produksi.</p>
        </div>

        <div className="space-y-4">
           <h4 className="text-[12px] font-black uppercase tracking-widest text-white">Links</h4>
           <div className="flex flex-col gap-3 text-zinc-400 text-[11px] font-bold tracking-wide">
              <button onClick={() => setView('shop')} className="text-left bg-transparent border-none text-zinc-400 hover:text-white transition-all cursor-pointer font-bold uppercase">Home</button>
              <button onClick={() => setView('login')} className="text-left bg-transparent border-none text-zinc-400 hover:text-white transition-all cursor-pointer font-bold uppercase">Konfirmasi Pembayaran</button>
              <button onClick={() => notify("Layanan Cek Ongkir segera hadir!")} className="text-left bg-transparent border-none text-zinc-400 hover:text-white transition-all cursor-pointer font-bold uppercase">Cek Ongkir..!</button>
           </div>
        </div>

        <div className="space-y-4">
           <h4 className="text-[12px] font-black uppercase tracking-widest text-white">Alamat</h4>
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-bold">
                 <Phone size={16} className="text-zinc-400"/>
                 <span>+62 821-1726-977</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-bold">
                 <MessageCircle size={16} className="text-zinc-400"/>
                 <span>+62 821-1726-977</span>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">@2024 DEVI_OFFICIAL LUXURY INC</div>
         <button onClick={() => setView('login')} className="flex items-center gap-2 text-zinc-700 text-[9px] tracking-widest hover:text-[#D4AF37] transition-all border border-white/5 px-6 py-2 rounded-full bg-zinc-950 cursor-pointer shadow-inner uppercase font-black font-bold">
            <ShieldAlert size={16} /> <span>ADMIN ACCESS</span>
         </button>
      </div>
    </footer>
  );
}
