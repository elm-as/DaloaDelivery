import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNetAmount, formatRelativeDate } from '../../lib/formatUtils';

export const EarningsModal = ({
  show,
  onClose,
  deliveredOrders
}: any) => {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {show && (
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
              <h3 className="text-xl font-bold text-grey-900">Historique des gains</h3>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-grey-100 rounded-full flex items-center justify-center text-grey-600 active:scale-95 transition-transform"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {deliveredOrders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-grey-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-grey-400" />
                  </div>
                  <p className="text-grey-500 font-medium">Aucun gain enregistré pour le moment.</p>
                </div>
              ) : (
                deliveredOrders.map((order: any) => {
                  const net = getNetAmount(order.proposed_price);
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        navigate(`/course/${order.id}`);
                        onClose();
                      }}
                      className="bg-grey-50 rounded-2xl p-4 border border-grey-100 flex items-center justify-between cursor-pointer hover:bg-grey-100 hover:border-grey-250 transition-all active:scale-[0.98]"
                    >
                      <div>
                        <p className="text-sm font-bold text-grey-900">Course #{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-grey-500 mt-0.5">{formatRelativeDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-success">{net} FCFA</p>
                        <p className="text-[10px] font-bold text-success/70 uppercase">net</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
