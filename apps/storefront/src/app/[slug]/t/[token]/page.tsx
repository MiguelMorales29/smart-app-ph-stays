import { PropertyFramedPlaceholder } from '@/components/frames/PropertyFramedPlaceholder';

export default function ConversationPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string; readonly token: string }>;
}) {
  return (
    <PropertyFramedPlaceholder
      params={params}
      title="Guest conversation"
      phase={7}
      detailKey="token"
      frame="conversation"
    />
  );
}
