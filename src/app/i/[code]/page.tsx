import { redirect } from 'next/navigation';

interface ShortUrlProps {
  params: Promise<{ code: string }>;
}

export default async function ShortInvoicePage({ params }: ShortUrlProps) {
  const { code } = await params;
  redirect(`/invoice/${code}`);
}
