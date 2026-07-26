import {
  Clock, PackageCheck, Truck, Navigation, CheckCircle2,
  XCircle, AlertTriangle, Timer, LucideIcon
} from 'lucide-react';

// Mapping statut → libellé français
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_seller_confirmation: 'En attente du vendeur',
    awaiting_pickup: 'En attente d\'un livreur',
    accepted: 'Livreur accepté',
    picked_up: 'Colis récupéré',
    in_transit: 'En livraison',
    delivered: 'Livré',
    cancelled: 'Annulé',
    disputed: 'Litige',
    auto_released: 'Clôturé automatiquement',
    completed: 'Livré',
  };
  return labels[status] || status;
}

// Mapping statut → classes Tailwind (fond, texte, bordure)
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_seller_confirmation: 'bg-blue-50 text-blue-700 border-blue-200',
    awaiting_pickup: 'bg-blue-50 text-blue-700 border-blue-200',
    accepted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    picked_up: 'bg-amber-50 text-amber-700 border-amber-200',
    in_transit: 'bg-orange-50 text-orange-700 border-orange-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    disputed: 'bg-pink-50 text-pink-700 border-pink-200',
    auto_released: 'bg-gray-100 text-gray-600 border-gray-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
  };
  return colors[status] || 'bg-gray-50 text-gray-600 border-gray-200';
}

// Mapping statut → icône Lucide
export function getStatusIcon(status: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    pending_seller_confirmation: Clock,
    awaiting_pickup: Clock,
    accepted: PackageCheck,
    picked_up: Truck,
    in_transit: Navigation,
    delivered: CheckCircle2,
    cancelled: XCircle,
    disputed: AlertTriangle,
    auto_released: Timer,
    completed: CheckCircle2,
  };
  return icons[status] || Clock;
}

// Formatage prix FCFA avec séparateur de milliers
export function formatPrice(amount: number): string {
  return Math.round(amount).toLocaleString('fr-FR') + ' FCFA';
}

// Prix net après commission (par défaut 10%)
export function formatPriceNet(amount: number, rate: number = 0.10): string {
  return formatPrice(Math.round(amount * (1 - rate)));
}

// Prix net (number) après commission
export function getNetAmount(amount: number, rate: number = 0.10): number {
  return Math.round(amount * (1 - rate));
}

// Date relative en français
export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffSec < 60) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH} h`;
  if (diffD < 7) return `Il y a ${diffD} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
