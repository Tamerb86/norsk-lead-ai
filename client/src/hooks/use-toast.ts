// Compatibility shim: maps the shadcn-style useToast() API onto sonner,
// which is the toast library actually used across the app.
import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function toast(opts: ToastOptions) {
  const { title, description, variant } = opts;
  const message = title ?? description ?? "";
  if (variant === "destructive") {
    return sonnerToast.error(message, description && title ? { description } : undefined);
  }
  return sonnerToast.success(message, description && title ? { description } : undefined);
}

export function useToast() {
  return { toast };
}

export default useToast;
