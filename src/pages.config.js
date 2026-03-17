/**
 * pages.config.js - Page routing configuration
 * Uses React.lazy for code splitting across all pages.
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'));
const BrowseProducts   = lazy(() => import('./pages/BrowseProducts'));
const BrowseShops      = lazy(() => import('./pages/BrowseShops'));
const BuyerDashboard   = lazy(() => import('./pages/BuyerDashboard'));
const Cart             = lazy(() => import('./pages/Cart'));
const FindNearby       = lazy(() => import('./pages/FindNearby'));
const Home             = lazy(() => import('./pages/Home'));
const Messages         = lazy(() => import('./pages/Messages'));
const OrderDetails     = lazy(() => import('./pages/OrderDetails'));
const ProductDetail    = lazy(() => import('./pages/ProductDetail'));
const ProfileCompletion = lazy(() => import('./pages/ProfileCompletion'));
const RegisterShop     = lazy(() => import('./pages/RegisterShop'));
const ShopCatalog      = lazy(() => import('./pages/ShopCatalog'));
const ShopDashboard    = lazy(() => import('./pages/ShopDashboard'));
const ShopProfile      = lazy(() => import('./pages/ShopProfile'));
const Wishlist         = lazy(() => import('./pages/Wishlist'));

export const PAGES = {
    "AdminDashboard":    AdminDashboard,
    "BrowseProducts":    BrowseProducts,
    "BrowseShops":       BrowseShops,
    "BuyerDashboard":    BuyerDashboard,
    "Cart":              Cart,
    "FindNearby":        FindNearby,
    "Home":              Home,
    "Messages":          Messages,
    "OrderDetails":      OrderDetails,
    "ProductDetail":     ProductDetail,
    "ProfileCompletion": ProfileCompletion,
    "RegisterShop":      RegisterShop,
    "ShopCatalog":       ShopCatalog,
    "ShopDashboard":     ShopDashboard,
    "ShopProfile":       ShopProfile,
    "Wishlist":          Wishlist,
};

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};