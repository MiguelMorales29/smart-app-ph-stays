import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function GuestAccountPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  return <PropertyFramedPlaceholder params={params} title="Guest account" phase={8} />;
}
