import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InlineAlert({ type = 'info', title, message, onDismiss, dismissible = true }) {
  const configs = {
    success: {
      gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30',
      border: 'border-emerald-400 dark:border-emerald-500',
      shadow: 'shadow-emerald-500/20',
      icon: CheckCircle2,
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      textColor: 'text-emerald-900 dark:text-emerald-100',
      secondaryText: 'text-emerald-700 dark:text-emerald-200',
    },
    error: {
      gradient: 'from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30',
      border: 'border-red-400 dark:border-red-500',
      shadow: 'shadow-red-500/20',
      icon: AlertCircle,
      iconBg: 'bg-gradient-to-br from-red-500 to-pink-600',
      textColor: 'text-red-900 dark:text-red-100',
      secondaryText: 'text-red-700 dark:text-red-200',
    },
    warning: {
      gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30',
      border: 'border-amber-400 dark:border-amber-500',
      shadow: 'shadow-amber-500/20',
      icon: AlertTriangle,
      iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600',
      textColor: 'text-amber-900 dark:text-amber-100',
      secondaryText: 'text-amber-700 dark:text-amber-200',
    },
    info: {
      gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30',
      border: 'border-blue-400 dark:border-blue-500',
      shadow: 'shadow-blue-500/20',
      icon: Info,
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      textColor: 'text-blue-900 dark:text-blue-100',
      secondaryText: 'text-blue-700 dark:text-blue-200',
    },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div className={cn(
      `bg-gradient-to-br ${config.gradient} border-2 ${config.border} rounded-xl shadow-lg ${config.shadow} p-4 backdrop-blur-sm`
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(`w-12 h-12 ${config.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          {title && (
            <h3 className={cn(`font-bold text-lg ${config.textColor}`)}>{title}</h3>
          )}
          {message && (
            <p className={cn(`text-sm ${config.secondaryText} mt-1`)}>{message}</p>
          )}
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(`${config.textColor} hover:opacity-60 transition-opacity flex-shrink-0`)}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}