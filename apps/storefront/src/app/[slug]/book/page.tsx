import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function BookStayPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  return <PropertyFramedPlaceholder params={params} title="Book a stay" phase={6} />;
}
