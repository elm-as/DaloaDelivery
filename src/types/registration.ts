export interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  photo: File | null;
  photoPreview: string;
  vehicle_type: string;
  vehicle_details: string;
  coverage_zones: string[];
  pricing_description: string;
  description: string;
  terms_accepted: boolean;
  payout_network?: string;
  payout_number?: string;
}

export const initialRegistrationFormData: RegistrationFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  photo: null,
  photoPreview: '',
  vehicle_type: 'Moto',
  vehicle_details: '',
  coverage_zones: ['Centre-ville', 'Commerce'],
  pricing_description: '',
  description: '',
  terms_accepted: true,
  payout_network: 'wave-ci',
  payout_number: '',
};

export const normalizePayoutNetwork = (network?: string): string => {
  const map: Record<string, string> = {
    wave: 'wave-ci',
    'wave-ci': 'wave-ci',
    orange: 'orange-money-ci',
    'orange-money-ci': 'orange-money-ci',
    mtn: 'mtn-ci',
    'mtn-ci': 'mtn-ci',
    moov: 'moov-ci',
    'moov-ci': 'moov-ci',
  };
  return network ? map[network] || 'wave-ci' : 'wave-ci';
};
