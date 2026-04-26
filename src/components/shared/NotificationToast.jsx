import { Toaster, toast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, Loader2, X, Zap, ShoppingCart, CreditCard, Package, Truck } from 'lucide-react';

// Bold, colorful toast notifications with gradients and shadows
export const notifySuccess = (message, description = null) => {
  toast.custom(
    (id) => (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-400 dark:border-emerald-500 rounded-xl shadow-xl shadow-emerald-500/30 p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-emerald-900 dark:text-emerald-100">{message}</p>
            {description && <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors">
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
      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/40 dark:to-pink-900/40 border-2 border-red-400 dark:border-red-500 rounded-xl shadow-xl shadow-red-500/30 p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-900 dark:text-red-100">{message}</p>
            {description && <p className="text-sm text-red-700 dark:text-red-200 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors">
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
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40 border-2 border-blue-400 dark:border-blue-500 rounded-xl shadow-xl shadow-blue-500/30 p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-blue-900 dark:text-blue-100">{message}</p>
            {description && <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">{description}</p>}
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors">
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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-700/40 border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-xl shadow-slate-500/20 p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{message}</p>
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
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40 border-2 border-indigo-400 dark:border-indigo-500 rounded-xl shadow-xl shadow-indigo-500/30 p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-indigo-900 dark:text-indigo-100">Added to Cart</p>
            <p className="text-sm text-indigo-700 dark:text-indigo-200 mt-1">{productName}</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors">
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
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-500 rounded-xl shadow-xl shadow-amber-500/30 p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-900 dark:text-amber-100">Processing Payment</p>
            <p className="text-sm text-amber-700 dark:text-amber-200 mt-0.5">Please wait...</p>
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
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-400 dark:border-emerald-500 rounded-xl shadow-xl shadow-emerald-500/30 p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-emerald-900 dark:text-emerald-100">Payment Successful! 🎉</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">Order #{orderId?.substring(0, 8).toUpperCase() || ''} confirmed</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors">
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
    confirmed: { icon: Package, gradient: 'from-blue-500 to-cyan-600', bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40', border: 'border-blue-400 dark:border-blue-500', shadow: 'shadow-blue-500/30', text: 'text-blue-900 dark:text-blue-100', label: 'Order Confirmed' },
    processing: { icon: Zap, gradient: 'from-purple-500 to-violet-600', bg: 'from-purple-50 to-violet-50 dark:from-purple-900/40 dark:to-violet-900/40', border: 'border-purple-400 dark:border-purple-500', shadow: 'shadow-purple-500/30', text: 'text-purple-900 dark:text-purple-100', label: 'Order Processing' },
    shipped: { icon: Truck, gradient: 'from-orange-500 to-amber-600', bg: 'from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40', border: 'border-orange-400 dark:border-orange-500', shadow: 'shadow-orange-500/30', text: 'text-orange-900 dark:text-orange-100', label: 'Order Shipped' },
    delivered: { icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40', border: 'border-emerald-400 dark:border-emerald-500', shadow: 'shadow-emerald-500/30', text: 'text-emerald-900 dark:text-emerald-100', label: 'Order Delivered' },
  };

  const config = statusConfig[status] || statusConfig.confirmed;
  const Icon = config.icon;

  toast.custom(
    (id) => (
      <div className={`bg-gradient-to-br ${config.bg} border-2 ${config.border} rounded-xl shadow-xl ${config.shadow} p-4 max-w-sm backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className={`font-bold ${config.text}`}>{config.label}</p>
            <p className={`text-sm ${config.text} opacity-75 mt-0.5`}>Status updated</p>
          </div>
          <button onClick={() => toast.dismiss(id)} className={`${config.text} hover:opacity-75 transition-opacity`}>
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