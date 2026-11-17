import { Fragment } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@smartapp/ui/components/breadcrumb';
import { Button } from '@smartapp/ui/components/button';
import { Separator } from '@smartapp/ui/components/separator';
import { SidebarTrigger } from '@smartapp/ui/components/sidebar';
import type { FormFactor } from '@smartapp/ui/hooks/use-form-factor';
import type { PageMeta } from '@/app/page-meta';
import { AccountMenu } from './AccountMenu';

export function TopBar({
  formFactor,
  page,
  admin = false,
}: {
  readonly formFactor: FormFactor;
  readonly page: PageMeta;
  readonly admin?: boolean | undefined;
}) {
  if (formFactor === 'phone') {
    return (
      <header className="sticky top-0 z-20 flex min-h-14 items-center gap-1 border-b border-border frost px-2 pt-safe">
        {page.parent ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label={`Back to ${page.parent.title}`}
            nativeButton={false}
            render={<Link to={page.parent.to} />}
          >
            <ArrowLeftIcon aria-hidden="true" />
          </Button>
        ) : null}
        <p className="min-w-0 flex-1 truncate px-2 font-heading text-lg font-semibold">
          {page.title}
        </p>
        <AccountMenu placement="top-bar" admin={admin} />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border frost px-4">
      <SidebarTrigger
        className="-ml-1 size-11 md:size-9 pointer-coarse:size-11"
        aria-label="Toggle sidebar"
      />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          {page.parent ? (
            <Fragment>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to={page.parent.to} />}>
                  {page.parent.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </Fragment>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate">{page.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
