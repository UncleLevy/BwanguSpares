import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  ShoppingCart, Menu, X, Home, Search, Store, User, 
  ShieldCheck, LayoutDashboard, Package, LogOut, ChevronDown, MapPin, Mail, Phone, ExternalLink, MessageSquare
} from "lucide-react";
import BottomNav from "@/components/shared/BottomNav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/notifications/NotificationBell";
import DarkModeToggle from "@/components/shared/DarkModeToggle";

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, x: -16, transition: { duration: 0.15 } },
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        const u = await base44.auth.me();
        setUser(u);
        const cart = await base44.entities.CartItem.filter({ buyer_email: u.email });
        setCartCount(cart.length);
      }
    })();
  }, [currentPageName]);

  const isAdmin = user?.role === "admin";
  const isShopOwner = user?.role === "shop_owner";
  const hideLayout = ["AdminDashboard", "ShopDashboard", "BuyerDashboard"].includes(currentPageName);

  // Pages that have their own AppHeader — hide the logo header on mobile for these
  const hasAppHeader = ["ProductDetail", "ShopProfile", "Cart", "Messages"].includes(currentPageName);

  if (hideLayout) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname + location.search} {...pageVariants}>
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  const navLinks = [
    { label: "Home", href: createPageUrl("Home"), icon: Home },
    { label: "Browse Parts", href: createPageUrl("BrowseProducts"), icon: Search },
    { label: "Shops", href: createPageUrl("BrowseShops"), icon: Store },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900">
      <header className={`sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm ${hasAppHeader ? "hidden md:block" : ""}`} style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Bwangu<span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Spares</span></span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(l => (
                <Link key={l.label} to={l.href}
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
                    <NotificationBell userEmail={user?.email} />
                    <Link to={createPageUrl("Messages")} className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </Link>
                    <Link to={createPageUrl("Cart")} className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                      {cartCount > 0 && (
                        <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-blue-600">
                          {cartCount}
                        </Badge>
                      )}
                    </Link>
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
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span>{user?.full_name?.split(' ')[0]}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("BuyerDashboard")} className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> My Dashboard
                          </Link>
                        </DropdownMenuItem>
                        {isShopOwner && (
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("ShopDashboard")} className="flex items-center gap-2">
                              <Store className="w-4 h-4" /> Shop Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
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
                          <Link to={createPageUrl("Messages")} className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Messages
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Cart")} className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" /> Cart
                            {cartCount > 0 && <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-blue-600">{cartCount}</Badge>}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("BuyerDashboard")} className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> My Dashboard
                          </Link>
                        </DropdownMenuItem>
                        {isShopOwner && (
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("ShopDashboard")} className="flex items-center gap-2">
                              <Store className="w-4 h-4" /> Shop Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
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

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 pb-4">
            <nav className="px-4 pt-2 space-y-1">
              {navLinks.map(l => (
                <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg">
                  <l.icon className="w-4 h-4 text-slate-400" /> {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname + location.search} {...pageVariants}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />

      <footer className="bg-blue-900 dark:bg-blue-950 text-slate-300 dark:text-slate-400 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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