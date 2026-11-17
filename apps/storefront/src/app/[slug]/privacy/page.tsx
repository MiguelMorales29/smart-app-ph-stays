import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function PrivacyPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  return <PropertyFramedPlaceholder params={params} title="Privacy notice" phase={4} />;
}
