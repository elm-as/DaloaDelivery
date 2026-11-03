interface StopAddressProps {
  label: string;
  district?: string | null;
  location?: string | null;
}

/**
 * Removes a leading "Quartier X —" prefix from the stored location,
 * because the district is already displayed as the stop title.
 */
function stripDistrictPrefix(location: string, district?: string | null): string {
  if (!district) return location;
  const prefix = new RegExp(`^\\s*Quartier\\s+${district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[—–-]\\s*`, 'i');
  return location.replace(prefix, '').trim();
}

export function StopAddress({ label, district, location }: StopAddressProps) {
  const detail = location ? stripDistrictPrefix(location, district) : '';
  const title = district || detail || 'Adresse non précisée';
  const showDetail = Boolean(district && detail);

  return (
    <div className="mt-2">
      <p className="text-[11px] font-semibold text-grey-400 uppercase tracking-wider">{label}</p>
      <p className="text-base font-bold text-grey-900 leading-tight">{title}</p>
      {showDetail && <p className="text-sm text-grey-600 leading-snug mt-0.5">{detail}</p>}
    </div>
  );
}

