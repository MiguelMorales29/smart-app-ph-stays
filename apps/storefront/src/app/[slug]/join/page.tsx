import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function GuestJoinPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  return <PropertyFramedPlaceholder params={params} title="Guest sign-in" phase={8} />;
}
