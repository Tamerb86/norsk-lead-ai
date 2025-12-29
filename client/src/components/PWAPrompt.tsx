import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Download, X } from 'lucide-react';

export function PWAPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Handle PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Handle app installed
  useEffect(() => {
    const handler = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success('NorskLeads er installert!');
    };

    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  // Show update toast when new version is available
  useEffect(() => {
    if (needRefresh) {
      toast(
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-blue-500" />
          <div className="flex-1">
            <p className="font-medium">Ny versjon tilgjengelig</p>
            <p className="text-sm text-muted-foreground">
              Klikk for å oppdatere til siste versjon
            </p>
          </div>
          <Button size="sm" onClick={handleUpdate}>
            Oppdater
          </Button>
        </div>,
        {
          duration: Infinity,
          id: 'pwa-update',
        }
      );
    }
  }, [needRefresh]);

  // Install prompt banner
  if (showInstallPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Installer NorskLeads</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Installer appen for raskere tilgang og offline-støtte
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall}>
                Installer
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowInstallPrompt(false)}
              >
                Ikke nå
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setShowInstallPrompt(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

export default PWAPrompt;
