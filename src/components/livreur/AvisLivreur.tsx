import type { Review } from '../../types/livreur';
import { Star, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface AvisLivreurProps {
  review: Review;
  index?: number;
}

export function AvisLivreur({ review, index = 0 }: AvisLivreurProps) {
  const formattedDate = new Date(review.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white rounded-card p-4 shadow-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-grey-900 text-sm">{review.reviewer_name}</h4>
            <p className="text-xs text-grey-400">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < review.rating ? 'fill-warning text-warning' : 'text-grey-300'}`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-grey-600 leading-relaxed">{review.comment}</p>
      )}
    </motion.div>
  );
}
