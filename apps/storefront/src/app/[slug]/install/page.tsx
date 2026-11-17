import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function InstallAppPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  return <PropertyFramedPlaceholder params={params} title="Install app" phase={9} />;
}
