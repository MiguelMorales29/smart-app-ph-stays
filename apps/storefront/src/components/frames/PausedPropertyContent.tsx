import type { PropertyView } from '@smartapp/core';
import { Alert, AlertDescription, AlertTitle } from '@smartapp/ui/components/alert';
import { MessageSquareIcon, PauseCircleIcon, PhoneIcon } from 'lucide-react';

export function PausedPropertyContent({ propertyView }: { readonly propertyView: PropertyView }) {
  const { property } = propertyView;
  const { contact } = property;

  const contactEntries: readonly {
    readonly label: string;
    readonly value: string;
    readonly href?: string;
  }[] = [
    ...(contact.phone
      ? [{ label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, '')}` }]
      : []),
    ...(property.privacy_contact
      ? [
          {
            label: 'Email',
            value: property.privacy_contact,
            href: `mailto:${property.privacy_contact}`,
          },
        ]
      : []),
    ...(contact.messenger
      ? [{ label: 'Messenger', value: contact.messenger, href: contact.messenger }]
      : []),
    ...(contact.facebook
      ? [{ label: 'Facebook', value: contact.facebook, href: contact.facebook }]
      : []),
    ...(contact.instagram
      ? [{ label: 'Instagram', value: contact.instagram, href: contact.instagram }]
      : []),
    ...(contact.viber ? [{ label: 'Viber', value: contact.viber }] : []),
    ...(contact.whatsapp ? [{ label: 'WhatsApp', value: contact.whatsapp }] : []),
  ];

  return (
    <section data-slot="paused-property" className="space-y-6">
      <Alert>
        <PauseCircleIcon className="size-4" />
        <AlertTitle>{property.name} is temporarily paused</AlertTitle>
        <AlertDescription>
          Online bookings are paused right now. Please contact the property directly using the
          details below.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <h1 className="font-heading text-xl font-semibold">{property.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {property.city}, {property.province}
        </p>

        {contactEntries.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {contactEntries.map((entry) => (
              <li key={entry.label} className="flex flex-wrap items-center gap-2 text-sm">
                {entry.label === 'Phone' ? (
                  <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="font-medium">{entry.label}:</span>
                {entry.href ? (
                  <a
                    href={entry.href}
                    className="inline-flex min-h-11 items-center text-[var(--card-link)] underline underline-offset-4"
                  >
                    {entry.value}
                  </a>
                ) : (
                  <span>{entry.value}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No contact details listed.</p>
        )}
      </div>
    </section>
  );
}
