import { words } from '@smartapp/core';

export default function HomePage() {
  return (
    <main>
      {words.appName} · {words.productName} · storefront
    </main>
  );
}
