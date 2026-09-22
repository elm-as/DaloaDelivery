import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
}

interface NotificationsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  loading: boolean;
  onNavigate: (link: string) => void;
}

export function NotificationsSheet({
  isOpen,
  onClose,
  notifications,
  loading,
  onNavigate,
}: NotificationsSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-grey-100">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-grey-900">Notifications</h3>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-grey-100 rounded-full flex items-center justify-center text-grey-600 active:scale-95 transition-transform"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      if (notif.link) {
                        onNavigate(notif.link);
                        onClose();
                      }
                    }}
                    className={`w-full text-left bg-white rounded-2xl p-4 border flex items-start gap-3 transition-colors ${
                      notif.link ? 'active:bg-grey-50' : 'cursor-default'
                    } ${
                      notif.type === 'error'
                        ? 'border-error/20 bg-error/5'
                        : notif.type === 'warning'
                        ? 'border-warning/20 bg-warning/5'
                        : notif.type === 'success'
                        ? 'border-success/20 bg-success/5'
                        : 'border-grey-100'
                    }`}
                  >
                    <div className="mt-0.5">
                      {notif.type === 'error' && <AlertTriangle className="w-5 h-5 text-error" />}
                      {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
                      {notif.type === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                      {notif.type === 'info' && <Info className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-sm font-bold mb-1 ${
                          notif.type === 'error'
                            ? 'text-error-600'
                            : notif.type === 'warning'
                            ? 'text-warning-700'
                            : notif.type === 'success'
                            ? 'text-success-700'
                            : 'text-grey-900'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <p className="text-sm text-grey-600 leading-snug">{notif.message}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
