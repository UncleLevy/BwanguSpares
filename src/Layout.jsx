import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  ShoppingCart, Menu, X, Home, Search, Store, User, 
  ShieldCheck, LayoutDashboard, Package, LogOut, ChevronDown, MapPin, Mail, Phone, ExternalLink, MessageSquare, Heart, Navigation, Scale, Lock
} from "lucide-react";
import BottomNav from "@/components/shared/BottomNav.jsx";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/notifications/NotificationBell";
import DarkModeToggle from "@/components/shared/DarkModeToggle";
import PageLoader from "@/components/shared/PageLoader";
import { Toaster } from "sonner";

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, x: -16, transition: { duration: 0.15 } },
};

function playTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const prevPage = React.useRef(currentPageName);

  // Show loader on page transitions
  useEffect(() => {
    if (prevPage.current !== currentPageName) {
      setPageLoading(true);
      const t = setTimeout(() => setPageLoading(false), 600);
      prevPage.current = currentPageName;
      return () => clearTimeout(t);
    }
  }, [currentPageName]);

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        const u = await base44.auth.me();
        setUser(u);
        const cart = await base44.entities.CartItem.filter({ buyer_email: u.email });
        setCartCount(cart.length);

        // Load unread message count
        const isShopOwner = u.role === "shop_owner";
        const convFilter = isShopOwner ? { shop_owner_email: u.email } : { buyer_email: u.email };
        const convs = await base44.entities.Conversation.filter(convFilter, "-last_message_date", 50);
        const unread = convs.reduce((sum, c) => sum + (isShopOwner ? (c.shop_unread || 0) : (c.buyer_unread || 0)), 0);
        setUnreadMessages(unread);
      }
    })();
  }, [currentPageName]);

  // Real-time unread message subscription
  useEffect(() => {
    if (!user) return;
    const isShopOwner = user.role === "shop_owner";
    const unsubscribe = base44.entities.Conversation.subscribe((event) => {
      if (event.type === "update") {
        const c = event.data;
        const mine = isShopOwner ? c.shop_owner_email === user.email : c.buyer_email === user.email;
        if (!mine) return;
        // Re-fetch total unread count
        base44.entities.Conversation.filter(
          isShopOwner ? { shop_owner_email: user.email } : { buyer_email: user.email },
          "-last_message_date", 50
        ).then((convs) => {
          const unread = convs.reduce((sum, c) => sum + (isShopOwner ? (c.shop_unread || 0) : (c.buyer_unread || 0)), 0);
          setUnreadMessages((prev) => {
            if (unread > prev) playTone();
            return unread;
          });
        });
      }
    });
    return unsubscribe;
  }, [user]);

  const isAdmin = user?.role === "admin";
  const isShopOwner = user?.role === "shop_owner";
  const hideLayout = ["AdminDashboard", "ShopDashboard", "BuyerDashboard"].includes(currentPageName);

  // Pages that have their own AppHeader — hide the logo header on mobile for these
  const hasAppHeader = ["ProductDetail", "ShopProfile", "Cart", "Messages"].includes(currentPageName);

  if (hideLayout) {
    return (
      <div
        style={{
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname + location.search} {...pageVariants}>
            {children}
          </motion.div>
        </AnimatePresence>
        <BottomNav />
      </div>
    );
  }

  const navLinks = [
    { label: "Home", href: createPageUrl("Home"), icon: Home },
    { label: "Browse Parts", href: createPageUrl("BrowseProducts"), icon: Search },
    { label: "Shops", href: createPageUrl("BrowseShops"), icon: Store },
    { label: "Find Nearby", href: createPageUrl("FindNearby"), icon: Navigation },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900">
      <PageLoader visible={pageLoading} />
      <Toaster position="top-right" richColors closeButton />
      <header
        role="banner"
        className={`sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm ${hasAppHeader ? "hidden md:block" : ""}`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 9L8.5 10.5L12 7L17 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="8" r="1" fill="white"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Bwangu<span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Spares</span></span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Site navigation">
              {navLinks.map(l => (
                <Link key={l.label} to={l.href}
                  aria-label={l.label}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-cyan-600 rounded-xl hover:bg-cyan-50/80 transition-all duration-200">
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {/* Desktop icons */}
              <div className="hidden md:flex items-center gap-2">
                <DarkModeToggle />
                {isAuthenticated && (
                   <>
                     {user?.role !== 'admin' && <NotificationBell userEmail={user?.email} />}
                     <Link to={createPageUrl(user?.role === 'shop_owner' ? "ShopDashboard" : "BuyerDashboard") + "?view=messages"} className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                       <MessageSquare className="w-5 h-5" />
                       {unreadMessages > 0 && (
                         <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900 pointer-events-none" />
                       )}
                     </Link>
                     {user?.role !== 'shop_owner' && user?.role !== 'admin' && (
                       <>
                         <Link to={createPageUrl("Wishlist")} className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors">
                           <Heart className="w-5 h-5" />
                         </Link>
                         <Link to={createPageUrl("Cart")} className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors z-10">
                           <ShoppingCart className="w-5 h-5" />
                           {cartCount > 0 && (
                             <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-blue-600 pointer-events-none">
                               {cartCount}
                             </Badge>
                           )}
                         </Link>
                       </>
                     )}
                   </>
                 )}
              </div>

              {isAuthenticated ? (
                <>
                  {/* Desktop: full user dropdown */}
                  <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 text-sm font-medium text-slate-700">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                            {user?.profile_picture_url ? (
                              <img src={user.profile_picture_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </div>
                          <span>{user?.full_name?.split(' ')[0]}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(isShopOwner ? "ShopDashboard" : isAdmin ? "AdminDashboard" : "BuyerDashboard")} className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> My Dashboard
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4" /> Admin Panel
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600 flex items-center gap-2">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Mobile: hamburger menu with all features */}
                  <div className="md:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                          <Menu className="w-5 h-5" />
                          {cartCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-blue-600 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                              {cartCount}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Navigation</div>
                        {navLinks.map(l => (
                          <DropdownMenuItem key={l.label} asChild>
                            <Link to={l.href} className="flex items-center gap-2">
                              <l.icon className="w-4 h-4" /> {l.label}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Account</div>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(user?.role === 'shop_owner' ? "ShopDashboard" : "BuyerDashboard") + "?view=messages"} className="flex items-center gap-2">
                            <span className="relative">
                              <MessageSquare className="w-4 h-4" />
                              {unreadMessages > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
                            </span>
                            Messages
                            {unreadMessages > 0 && <Badge className="ml-auto h-5 min-w-[20px] flex items-center justify-center p-0 px-1 text-[10px] bg-red-500">{unreadMessages}</Badge>}
                          </Link>
                        </DropdownMenuItem>
                        {user?.role !== 'shop_owner' && user?.role !== 'admin' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl("Wishlist")} className="flex items-center gap-2">
                                <Heart className="w-4 h-4" /> Wishlist
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl("Cart")} className="flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" /> Cart
                                {cartCount > 0 && <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-blue-600">{cartCount}</Badge>}
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(isShopOwner ? "ShopDashboard" : isAdmin ? "AdminDashboard" : "BuyerDashboard")} className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> My Dashboard
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4" /> Admin Panel
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-2">
                          <DarkModeToggle />
                          <span className="text-sm">Dark Mode</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600 flex items-center gap-2">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden md:block">
                    <DarkModeToggle />
                  </div>
                  <Button onClick={() => base44.auth.redirectToLogin()} className="hidden md:flex bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm h-9 px-6 rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-200">
                    Sign In
                  </Button>
                  {/* Mobile unauthenticated: simple menu */}
                  <div className="md:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {navLinks.map(l => (
                          <DropdownMenuItem key={l.label} asChild>
                            <Link to={l.href} className="flex items-center gap-2">
                              <l.icon className="w-4 h-4" /> {l.label}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-2">
                          <DarkModeToggle />
                          <span className="text-sm">Dark Mode</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => base44.auth.redirectToLogin()} className="text-blue-600 font-medium flex items-center gap-2">
                          <User className="w-4 h-4" /> Sign In
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>


      </header>

      <main
        className="w-full pb-16 md:pb-0"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4rem)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname + location.search} {...pageVariants}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />

      <footer
        role="contentinfo"
        className="bg-blue-900 dark:bg-blue-950 text-slate-300 dark:text-slate-400 mt-20"
        style={{
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold">BwanguSpares</span>
              </div>
              <p className="text-sm leading-relaxed">Zambia's premier virtual marketplace for auto spare parts. Connecting shops, mechanics and buyers.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to={createPageUrl("BrowseProducts")} className="flex items-center gap-2 hover:text-white transition-colors"><Search className="w-4 h-4 shrink-0" /> Browse Parts</Link>
                <Link to={createPageUrl("BrowseShops")} className="flex items-center gap-2 hover:text-white transition-colors"><Store className="w-4 h-4 shrink-0" /> Find Shops</Link>
                <Link to={createPageUrl("RegisterShop")} className="flex items-center gap-2 hover:text-white transition-colors"><ExternalLink className="w-4 h-4 shrink-0" /> Register Your Shop</Link>
                <Link to={createPageUrl("TermsAndConditions")} className="flex items-center gap-2 hover:text-white transition-colors"><Scale className="w-4 h-4 shrink-0" /> Terms &amp; Conditions</Link>
                <Link to={createPageUrl("PrivacyPolicy")} className="flex items-center gap-2 hover:text-white transition-colors"><Lock className="w-4 h-4 shrink-0" /> Privacy Policy</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Contact</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /> Flat 15C Kalewa Complex, Ndola</p>
                <a href="mailto:admin@bwangu.com" className="flex items-center gap-2 hover:text-white transition-colors"><Mail className="w-4 h-4 shrink-0" /> admin@bwangu.com</a>
                <a href="tel:+260763109823" className="flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-4 h-4 shrink-0" /> +260 763 109 823</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-xs space-y-1">
            <p>© 2026 BwanguSpares. All rights reserved.</p>
            <p className="text-slate-500">Site was Designed and Developed by Ikhumbi-Tech Center</p>
          </div>
        </div>
      </footer>
    </div>
  );
}