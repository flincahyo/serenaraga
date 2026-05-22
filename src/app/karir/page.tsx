import { Metadata } from 'next';
import KarirClient from './KarirClient';

export const metadata: Metadata = {
  title: 'Karir Terapis | SerenaRaga Home Massage',
  description: 'Bergabunglah bersama tim terapis profesional SerenaRaga. Dapatkan penghasilan fleksibel, lingkungan kerja yang aman, dan dukungan pelatihan berkelanjutan.',
};

export default function KarirPage() {
  return <KarirClient />;
}
