import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function FindBookingPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  return <PropertyFramedPlaceholder params={params} title="Find my booking" phase={7} />;
}
