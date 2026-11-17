import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function InquirePage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  return <PropertyFramedPlaceholder params={params} title="Send an inquiry" phase={6} />;
}
