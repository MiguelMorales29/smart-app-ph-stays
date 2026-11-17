import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function PropertyHomePage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  return <PropertyFramedPlaceholder params={params} title="Property home" phase={4} />;
}
