import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import OrderSuccess from './pages/OrderSuccess';
import BuyerSettings from './pages/BuyerSettings';
import SubscriptionCheckout from './pages/SubscriptionCheckout';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { base44 } from '@/api/base44Client';
import { useEffect, useState, Suspense, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavProvider, useNav } from '@/lib/navigationContext';
import { createPageUrl } from '@/utils';

// Platform detection for web
const Platform = { OS: 'web' };
const StatusBar = null;

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null;

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// ─── Loading fallback ────────────────────────────────────────────────────────
const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-600 rounded-full animate-spin" />
  </div>
);

// ─── Smooth page transitions ────────────────────────────────────────────
// direction: "forward" = push right-to-left; "back" = pop left-to-right
const pageTransition = { type: "spring", stiffness: 300, damping: 30, mass: 1 };

function makeVariants(direction) {
  return {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };
}

// ─── Animated page wrapper ───────────────────────────────────────────────────
const AnimatedPage = ({ children, direction }) => {
  const variants = makeVariants(direction);
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ 
        minHeight: "100%", 
        willChange: "transform, opacity",
        overflow: "hidden",
        transform: "translate3d(0, 0, 0)"
      }}
    >
      {children}
    </motion.div>
  );
};

// ─── Route recorder — sync browser navigations into the nav context ──────────
function RouteRecorder() {
  const location = useLocation();
  const { recordNavigation } = useNav();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    recordNavigation(location.pathname, location.search);
    // Scroll to top on navigation for smooth experience
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return null;
}

// ─── All animated routes ─────────────────────────────────────────────────────
const AnimatedRoutes = () => {
  const location = useLocation();
  const { direction } = useNav();

  return (
    <>
      <RouteRecorder />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<DashboardRedirect />} />
          {Object.entries(Pages).map(([path, Page]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={
                <AnimatedPage direction={direction}>
                  <LayoutWrapper currentPageName={path}>
                    <Suspense fallback={<PageFallback />}>
                      <Page />
                    </Suspense>
                  </LayoutWrapper>
                </AnimatedPage>
              }
            />
          ))}
          <Route
            path="/TermsAndConditions"
            element={
              <AnimatedPage direction={direction}>
                <LayoutWrapper currentPageName="TermsAndConditions">
                  <TermsAndConditions />
                </LayoutWrapper>
              </AnimatedPage>
            }
          />
          <Route
            path="/PrivacyPolicy"
            element={
              <AnimatedPage direction={direction}>
                <LayoutWrapper currentPageName="PrivacyPolicy">
                  <PrivacyPolicy />
                </LayoutWrapper>
              </AnimatedPage>
            }
          />
          <Route
            path="/OrderSuccess"
            element={
              <AnimatedPage direction={direction}>
                <LayoutWrapper currentPageName="OrderSuccess">
                  <OrderSuccess />
                </LayoutWrapper>
              </AnimatedPage>
            }
          />
          <Route
            path="/BuyerSettings"
            element={
              <AnimatedPage direction={direction}>
                <LayoutWrapper currentPageName="BuyerSettings">
                  <BuyerSettings />
                </LayoutWrapper>
              </AnimatedPage>
            }
          />
          <Route
            path="/SubscriptionCheckout"
            element={
              <AnimatedPage direction={direction}>
                <LayoutWrapper currentPageName="SubscriptionCheckout">
                  <SubscriptionCheckout />
                </LayoutWrapper>
              </AnimatedPage>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

// ─── Dashboard redirect at "/" ────────────────────────────────────────────────
const DashboardRedirect = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) {
        base44.auth.me().then(u => { setUser(u); setLoading(false); });
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <PageFallback />;
  if (user?.role === 'admin') return <Navigate to="/AdminDashboard" replace />;
  if (user?.role === 'shop_owner') return <Navigate to="/ShopDashboard" replace />;

  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Suspense fallback={<PageFallback />}>
        <MainPage />
      </Suspense>
    </LayoutWrapper>
  );
};

// ─── Auth gate ───────────────────────────────────────────────────────────────
const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) return <PageFallback />;

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <NavProvider>
      <AnimatedRoutes />
    </NavProvider>
  );
};

// ─── App root ────────────────────────────────────────────────────────────────
function App() {
  const isAndroid = Platform.OS === 'android';

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          {/* StatusBar ONLY on Android - fixes white status bar in APK */}
          {isAndroid && StatusBar && (
            <StatusBar
              translucent={true}
              backgroundColor="transparent"
              barStyle="dark-content"   // Change to "light-content" if your header is dark
            />
          )}

          <AuthenticatedApp />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;