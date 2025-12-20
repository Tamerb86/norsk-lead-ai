import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info, Undo, ExternalLink, RotateCw } from "lucide-react";
import { ReactNode } from "react";

// Enhanced toast types with icons and custom styling
export const toastSuccess = (message: string, options?: {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}) => {
  return toast.success(message, {
    description: options?.description,
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    duration: options?.duration || 4000,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
    className: "border-l-4 border-green-500",
  });
};

export const toastError = (message: string, options?: {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}) => {
  return toast.error(message, {
    description: options?.description,
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    duration: options?.duration || 5000,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
    className: "border-l-4 border-red-500",
  });
};

export const toastWarning = (message: string, options?: {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}) => {
  return toast.warning(message, {
    description: options?.description,
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    duration: options?.duration || 4500,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
    className: "border-l-4 border-yellow-500",
  });
};

export const toastInfo = (message: string, options?: {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}) => {
  return toast.info(message, {
    description: options?.description,
    icon: <Info className="w-5 h-5 text-blue-600" />,
    duration: options?.duration || 4000,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
    className: "border-l-4 border-blue-500",
  });
};

// Specialized toast for delete operations with undo
export const toastDeleteWithUndo = (
  itemName: string,
  onUndo: () => void,
  options?: {
    description?: string;
    duration?: number;
  }
) => {
  return toast.success(`${itemName} slettet`, {
    description: options?.description || "Klikk 'Angre' for å gjenopprette",
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    duration: options?.duration || 6000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <Undo className="w-4 h-4" />
          Angre
        </span>
      ) as any,
      onClick: onUndo,
    },
    className: "border-l-4 border-green-500",
  });
};

// Toast with view details link
export const toastWithViewDetails = (
  message: string,
  onViewDetails: () => void,
  options?: {
    description?: string;
    duration?: number;
  }
) => {
  return toast.success(message, {
    description: options?.description,
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    duration: options?.duration || 5000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <ExternalLink className="w-4 h-4" />
          Se detaljer
        </span>
      ) as any,
      onClick: onViewDetails,
    },
    className: "border-l-4 border-green-500",
  });
};

// Toast with retry action for failed operations
export const toastErrorWithRetry = (
  message: string,
  onRetry: () => void,
  options?: {
    description?: string;
    duration?: number;
  }
) => {
  return toast.error(message, {
    description: options?.description || "Klikk 'Prøv igjen' for å forsøke på nytt",
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    duration: options?.duration || 6000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <RotateCw className="w-4 h-4" />
          Prøv igjen
        </span>
      ) as any,
      onClick: onRetry,
    },
    className: "border-l-4 border-red-500",
  });
};

// Loading toast with promise
export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};
