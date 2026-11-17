import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function UnitDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string; readonly unit: string }>;
}) {
  return (
    <PropertyFramedPlaceholder params={params} title="Unit details" phase={4} detailKey="unit" />
  );
}
