import { Toaster, toast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, Loader2, X, Zap, ShoppingCart, CreditCard, Package, Truck } from 'lucide-react';

// Bold, colorful toast notifications with gradients and shadows
export const notifySuccess = (message, description = null) => {
  toast.custom(
    (id) => (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-slate-50">{message}</p>
            {description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    ),
    { duration: 4000 }
  );
};

export const notifyError = (message, description = null) => {
  toast.custom(
    (id) => (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-slate-50">{message}</p>
            {description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
};

export const notifyInfo = (message, description = null) => {
  toast.custom(
    (id) => (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-slate-50">{message}</p>
            {description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    ),
    { duration: 4000 }
  );
};

export const notifyLoading = (message) => {
  return toast.custom(
    (id) => (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="font-bold text-slate-900 dark:text-slate-50">{message}</p>
        </div>
      </div>
    ),
    { duration: Infinity }
  );
};

// Transaction-specific notifications
export const notifyCartAdded = (productName) => {
  toast.custom(
    (id) => (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-slate-50">Added to Cart</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">{productName}</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    ),
    { duration: 3000 }
  );
};

export const notifyPaymentProcessing = () => {
  return toast.custom(
    (id) => (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-slate-50">Processing Payment</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Please wait...</p>
          </div>
        </div>
      </div>
    ),
    { duration: Infinity }
  );
};

export const notifyPaymentSuccess = (orderId) => {
  toast.custom(
    (id) => (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-slate-50">Payment Successful! 🎉</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Order #{orderId?.substring(0, 8).toUpperCase() || ''} confirmed</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    ),
    { duration: 4000 }
  );
};

export const notifyOrderStatusUpdate = (status) => {
  const statusConfig = {
    confirmed: { icon: Package, gradient: 'from-blue-500 to-blue-600' },
    processing: { icon: Zap, gradient: 'from-purple-500 to-purple-600' },
    shipped: { icon: Truck, gradient: 'from-orange-500 to-orange-600' },
    delivered: { icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600' },
  };

  const statusLabels = { confirmed: 'Order Confirmed', processing: 'Order Processing', shipped: 'Order Shipped', delivered: 'Order Delivered' };
  const config = statusConfig[status] || statusConfig.confirmed;
  const Icon = config.icon;

  toast.custom(
    (id) => (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-slate-50">{statusLabels[status]}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Status updated</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    ),
    { duration: 3500 }
  );
};

export const CustomToaster = () => (
  <Toaster
    position="top-right"
    richColors
    closeButton
    theme="system"
    expand={true}
    visibleToasts={4}
    gap={12}
  />
);