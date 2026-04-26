import { Toaster, toast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, Loader2, X, Zap, ShoppingCart, CreditCard, Package, Truck } from 'lucide-react';

// Enhanced notification styles and handlers
export const notifySuccess = (message, description = null) => {
  toast.custom(
    (id) => (
      <div className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{message}</p>
            {description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
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
      <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{message}</p>
            {description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
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
      <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{message}</p>
            {description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
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
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-400 animate-spin flex-shrink-0" />
          <p className="font-semibold text-slate-900 dark:text-slate-100">{message}</p>
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
      <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Added to Cart</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{productName}</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
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
      <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Processing Payment</p>
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
      <div className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Payment Successful! 🎉</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Order #{orderId?.substring(0, 8).toUpperCase() || ''} confirmed</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ),
    { duration: 4000 }
  );
};

export const notifyOrderStatusUpdate = (status) => {
  const statusConfig = {
    confirmed: { icon: Package, color: 'text-blue-600 dark:text-blue-400', bg: 'border-blue-200 dark:border-blue-800', label: 'Order Confirmed' },
    processing: { icon: Zap, color: 'text-purple-600 dark:text-purple-400', bg: 'border-purple-200 dark:border-purple-800', label: 'Order Processing' },
    shipped: { icon: Truck, color: 'text-orange-600 dark:text-orange-400', bg: 'border-orange-200 dark:border-orange-800', label: 'Order Shipped' },
    delivered: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'border-emerald-200 dark:border-emerald-800', label: 'Order Delivered' },
  };

  const config = statusConfig[status] || statusConfig.confirmed;
  const Icon = config.icon;

  toast.custom(
    (id) => (
      <div className={`bg-white dark:bg-slate-800 border ${config.bg} rounded-xl shadow-lg p-4 max-w-sm`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{config.label}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Status updated</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
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