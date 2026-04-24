
import React, { useState, useMemo } from 'react';
import { Bell, Info, Calendar, X, ExternalLink, ShieldAlert, Camera, Copy, MonitorOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, SecurityAlert } from '../types';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'important' | 'security';
  date: number;
  originalAlert?: SecurityAlert;
}

interface NotificationBellProps {
  profile: UserProfile | null;
  alerts?: SecurityAlert[];
}

const NotificationBell: React.FC<NotificationBellProps> = ({ profile, alerts = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = useMemo(() => {
    const list: Notification[] = [];
    
    // Default Welcome Notification
    list.push({
      id: 'welcome',
      title: 'Bienvenue sur PERASafe',
      message: 'Votre coffre-fort numérique est prêt. Sécurisez vos premières notes dès maintenant.',
      type: 'info',
      date: profile?.createdAt || Date.now()
    });

    // Security Alerts Integration
    alerts.forEach(alert => {
      let icon = <ShieldAlert className="w-4 h-4" />;
      let title = "Alerte de Sécurité";
      let message = `Violation détectée sur le document "${alert.documentTitle}" par ${alert.readerEmail}.`;

      if (alert.type === 'PHONE_DETECTED') {
        title = "Tentative de captation (Téléphone)";
        message = `Un téléphone a été détecté par la caméra de ${alert.readerEmail} lors de la lecture de "${alert.documentTitle}".`;
      } else if (alert.type === 'SCREENSHOT_ATTEMPT') {
        title = "Tentative de capture d'écran";
        message = `Une capture d'écran ou un raccourci interdit a été détecté pour ${alert.readerEmail} sur "${alert.documentTitle}".`;
      } else if (alert.type === 'CLIPBOARD_COPY') {
        title = "Tentative de copie (Presse-papier)";
        message = `L'utilisateur ${alert.readerEmail} a tenté de copier le contenu de "${alert.documentTitle}".`;
      } else if (alert.type === 'BLUR_LOSS') {
        title = "Perte de focus (Risque de capture)";
        message = `La fenêtre sécurisée a perdu le focus pour ${alert.readerEmail} (possible enregistreur externe).`;
      }

      list.push({
        id: alert.id,
        title,
        message,
        type: 'security',
        date: alert.timestamp,
        originalAlert: alert
      });
    });

    // Subscription Notification
    if (profile?.subscriptionExpiresAt) {
      const now = Date.now();
      const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
      const timeLeft = profile.subscriptionExpiresAt - now;

      if (timeLeft > 0 && timeLeft <= tenDaysInMs) {
        const days = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
        list.push({
          id: 'sub-ending',
          title: 'Abonnement arrive à échéance',
          message: `Attention, votre abonnement prend fin dans ${days} jour(s). Pensez à le renouveler pour maintenir vos accès.`,
          type: 'warning',
          date: now
        });
      } else if (timeLeft <= 0) {
        list.push({
          id: 'sub-expired',
          title: 'Abonnement expiré',
          message: 'Votre abonnement a expiré. Certaines fonctionnalités de gestion sont restreintes.',
          type: 'important',
          date: now
        });
      }
    }

    return list.sort((a, b) => b.date - a.date);
  }, [profile, alerts]);

  const getAlertIcon = (type: Notification['type'], alertType?: SecurityAlert['type']) => {
    if (type === 'security') {
      if (alertType === 'PHONE_DETECTED') return <Camera className="w-4 h-4" />;
      if (alertType === 'SCREENSHOT_ATTEMPT') return <MonitorOff className="w-4 h-4" />;
      if (alertType === 'CLIPBOARD_COPY') return <Copy className="w-4 h-4" />;
      return <ShieldAlert className="w-4 h-4" />;
    }
    if (type === 'warning') return <Calendar className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      <button 
        id="tour-btn-notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
      >
        <Bell className="w-5 h-5" />
        {notifications.filter(n => n.type === 'security' || n.type === 'important').length > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-800">Centre de notifications</h3>
                <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black">{notifications.length}</span>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className="p-6 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-default">
                      <div className="flex gap-4">
                        <div className={`mt-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'warning' ? 'bg-orange-100 text-orange-600' : 
                          n.type === 'important' ? 'bg-red-100 text-red-600' : 
                          n.type === 'security' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' :
                          'bg-indigo-100 text-indigo-600'
                        }`}>
                          {getAlertIcon(n.type, n.originalAlert?.type)}
                        </div>
                        <div>
                          <p className={`font-black text-xs uppercase tracking-tight mb-1 ${n.type === 'security' ? 'text-red-600' : 'text-slate-900'}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                          <div className="mt-3 flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {new Date(n.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                             </span>
                             {n.id === 'sub-ending' && (
                               <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                 S'abonner <ExternalLink className="w-3 h-3" />
                               </button>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune notification</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50/50 text-center">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
