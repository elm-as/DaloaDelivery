import React, { useState } from 'react';
import { Eye, Phone, MessageSquare } from 'lucide-react';

interface RevealablePhoneProps {
  phone: string;
  /** Rendu compact pour une carte de liste ; par défaut, bloc complet avec actions. */
  compact?: boolean;
  className?: string;
}

/**
 * Masque le numéro d'un livreur jusqu'à un geste explicite.
 *
 * L'annuaire est public — c'est un choix assumé, un livreur y est pour être
 * joignable. Mais un numéro affiché en clair sur une page publique se moissonne
 * en masse, et les livreurs se retrouvent démarchés par des gens qui n'ont
 * jamais eu l'intention de commander.
 *
 * Le dévoilement demande donc un clic. À savoir, et c'est important : cela
 * freine la collecte automatique et l'indexation, ce n'est pas un contrôle
 * d'accès. Le numéro est dans la réponse de l'API ; pour qu'il ne parte plus du
 * tout, il faudrait cesser de le renvoyer et le servir à la demande.
 */
export const RevealablePhone: React.FC<RevealablePhoneProps> = ({
  phone,
  compact = false,
  className,
}) => {
  const [revealed, setRevealed] = useState(false);

  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;

  // On laisse voir les deux derniers chiffres : de quoi reconnaître un numéro
  // qu'on connaît déjà, pas assez pour le reconstituer.
  const masked = `${digits.slice(0, 2)} •• •• •• ${digits.slice(-2)}`;
  const whatsappNumber = digits.startsWith('225') ? digits : `225${digits}`;

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        aria-label="Afficher le numéro du livreur"
        className={
          className ??
          (compact
            ? 'inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700'
            : 'flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all hover:bg-black active:scale-95')
        }
      >
        <Eye className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        <span>{compact ? masked : `Voir le numéro : ${masked}`}</span>
      </button>
    );
  }

  if (compact) {
    return (
      <a
        href={`tel:${phone}`}
        onClick={(e) => e.stopPropagation()}
        className={
          className ??
          'inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-emerald-700 transition-colors hover:bg-emerald-100'
        }
      >
        <Phone className="h-3.5 w-3.5" />
        <span>{phone}</span>
      </a>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#20ba59] active:scale-95"
      >
        <MessageSquare className="h-4 w-4" />
        Discuter sur WhatsApp
      </a>
      <a
        href={`tel:${phone}`}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all hover:bg-black active:scale-95"
      >
        <Phone className="h-4 w-4" />
        Appeler {phone}
      </a>
    </div>
  );
};

export default RevealablePhone;
