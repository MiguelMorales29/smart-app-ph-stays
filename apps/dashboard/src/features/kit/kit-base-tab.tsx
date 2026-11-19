import { useState, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@smartapp/ui/components/alert';
import { Avatar, AvatarBadge, AvatarFallback } from '@smartapp/ui/components/avatar';
import { Badge } from '@smartapp/ui/components/badge';
import { Banner, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@smartapp/ui/components/breadcrumb';
import { Button } from '@smartapp/ui/components/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@smartapp/ui/components/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@smartapp/ui/components/empty';
import { Input } from '@smartapp/ui/components/input';
import { ScrollArea } from '@smartapp/ui/components/scroll-area';
import { Separator } from '@smartapp/ui/components/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@smartapp/ui/components/sheet';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Spinner } from '@smartapp/ui/components/spinner';
import { toast, Toaster } from '@smartapp/ui/components/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@smartapp/ui/components/tooltip';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  HomeIcon,
  InboxIcon,
  InfoIcon,
  PanelLeftIcon,
  PlusIcon,
  TriangleAlertIcon,
} from 'lucide-react';

export function DualSurfaceShowcase({
  title,
  source,
  useFor,
  dont,
  render,
}: {
  readonly title: string;
  readonly source: string;
  readonly useFor: string;
  readonly dont: string;
  readonly render: (surface: 'light' | 'dark') => ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <Badge variant="outline">{source}</Badge>
      </div>
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p>
          <strong className="font-medium text-foreground">Use for:</strong> {useFor}
        </p>
        <p>
          <strong className="font-medium text-foreground">Don&apos;t:</strong> {dont}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="light rounded-lg border border-border bg-background p-4 text-foreground">
          <p className="mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Light
          </p>
          {render('light')}
        </div>
        <div className="dark rounded-lg border border-border bg-background p-4 text-foreground">
          <p className="mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Dark
          </p>
          {render('dark')}
        </div>
      </div>
    </section>
  );
}

export function KitBaseTab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <Toaster>
      <TooltipProvider>
        <div className="space-y-6">
          <DualSurfaceShowcase
            title="Button (6 variants · sizes)"
            source="shadcn base-nova"
            useFor="Primary booking/saving actions, secondary triggers, and destructive confirmations."
            dont="Mix multiple default primary buttons in one toolbar; keep one clear primary CTA per view."
            render={() => (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="xs">XS</Button>
                  <Button size="sm">SM</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">LG</Button>
                  <Button size="icon" aria-label="Add item">
                    <PlusIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          />

          <DualSurfaceShowcase
            title="Badge (6 variants)"
            source="shadcn base-nova"
            useFor="Compact labels, counts, and status pills paired with semantic text/icon."
            dont="Place long sentences inside a badge or rely on colour alone without words."
            render={() => (
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="ghost">Ghost</Badge>
                <Badge variant="link">Link</Badge>
              </div>
            )}
          />

          <DualSurfaceShowcase
            title="Alert (default · destructive)"
            source="shadcn base-nova"
            useFor="Inline warnings, policy callouts, and paused/error messages inside a page."
            dont="Use Alert for transient save feedback; use Toast instead."
            render={() => (
              <div className="space-y-3">
                <Alert>
                  <InfoIcon aria-hidden="true" />
                  <AlertTitle>Policies saved</AlertTitle>
                  <AlertDescription>
                    Guests with open bookings see your updated rules immediately.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircleIcon aria-hidden="true" />
                  <AlertTitle>Upload blocked</AlertTitle>
                  <AlertDescription>
                    Your 10 MB storage pool is full. Free space before adding photos.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          />

          <DualSurfaceShowcase
            title="Banner (5 variants)"
            source="@diceui/banner"
            useFor="Full-width top-of-frame indicators: Preview · sample data, Demo property, Offline, Paused account."
            dont="Stack more than two top banners simultaneously on mobile viewports."
            render={() => (
              <div className="space-y-2 overflow-hidden rounded-lg border border-border">
                <Banner variant="default" dismissible={false}>
                  <BannerIcon>
                    <InfoIcon className="size-4" />
                  </BannerIcon>
                  <BannerTitle>Default neutral notice</BannerTitle>
                </Banner>
                <Banner variant="info" dismissible={false}>
                  <BannerIcon>
                    <InfoIcon className="size-4" />
                  </BannerIcon>
                  <BannerTitle>Demo · not a real property</BannerTitle>
                </Banner>
                <Banner variant="success" dismissible={false}>
                  <BannerIcon>
                    <CheckCircle2Icon className="size-4" />
                  </BannerIcon>
                  <BannerTitle>Published live changes</BannerTitle>
                </Banner>
                <Banner variant="warning" dismissible={false}>
                  <BannerIcon>
                    <TriangleAlertIcon className="size-4" />
                  </BannerIcon>
                  <BannerTitle>Preview · sample data</BannerTitle>
                </Banner>
                <Banner variant="destructive" dismissible={false}>
                  <BannerIcon>
                    <AlertCircleIcon className="size-4" />
                  </BannerIcon>
                  <BannerTitle>Account paused notice</BannerTitle>
                </Banner>
              </div>
            )}
          />

          <DualSurfaceShowcase
            title="Avatar & AvatarBadge"
            source="shadcn base-nova"
            useFor="Owner/guest initials, property monogram logos, and online/status dots."
            dont="Rely on AvatarBadge colour alone without a screen-reader status line."
            render={() => (
              <div className="flex items-center gap-4">
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary text-primary-foreground">US</AvatarFallback>
                </Avatar>
                <Avatar size="default">
                  <AvatarFallback className="bg-primary text-primary-foreground">ES</AvatarFallback>
                  <AvatarBadge className="bg-success" />
                </Avatar>
                <Avatar size="lg">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    BB
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          />

          <DualSurfaceShowcase
            title="Input & Separator"
            source="shadcn base-nova"
            useFor="Single-line text/number/date fields (16 px+ to stop mobile Safari zoom) and hairline section dividers."
            dont="Drop below 16 px font size on inputs or omit an associated label."
            render={(surface) => (
              <div className="space-y-3">
                <Input
                  placeholder="Enter booking reference"
                  aria-label={`Sample input ${surface}`}
                />
                <Input
                  disabled
                  value="Disabled read-only value"
                  aria-label={`Disabled input ${surface}`}
                />
                <Input
                  aria-invalid="true"
                  defaultValue="Bad value"
                  aria-label={`Invalid input ${surface}`}
                />
                <Separator />
                <div className="flex h-5 items-center gap-3 text-xs text-muted-foreground">
                  <span>Check-in 2 PM</span>
                  <Separator orientation="vertical" />
                  <span>Check-out 12 NN</span>
                </div>
              </div>
            )}
          />

          <DualSurfaceShowcase
            title="Breadcrumb & ScrollArea"
            source="shadcn base-nova"
            useFor="Parent-to-child path navigation in dashboard TopBar and bounded scrollable panels."
            dont="Put more than 2 breadcrumb levels on a narrow phone bar; use back arrow instead."
            render={() => (
              <div className="space-y-3">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#kit-top">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Payment accounts</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <ScrollArea className="h-24 rounded-md border border-border bg-card p-3">
                  <div className="space-y-2 text-xs">
                    <p>BPI · #0041 · Verified</p>
                    <p>GCash · 0917 000 0101 · Verified</p>
                    <p>Maya · 0918 000 0102 · Active</p>
                    <p>UnionBank · #8821 · Active</p>
                    <p>QR Ph · Primary static standee</p>
                  </div>
                </ScrollArea>
              </div>
            )}
          />

          <DualSurfaceShowcase
            title="Empty, Skeleton & Spinner"
            source="shadcn base-nova"
            useFor="No-items placeholders (with one action), loading placeholders, and inline busy indicators."
            dont="Replace full-page LoadingState with an unlabelled spinner alone."
            render={() => (
              <div className="space-y-4">
                <Empty className="border border-dashed border-border bg-card py-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <InboxIcon />
                    </EmptyMedia>
                    <EmptyTitle>No proofs waiting</EmptyTitle>
                    <EmptyDescription>New guest receipts will appear here.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button size="sm" variant="outline">
                      View approved
                    </Button>
                  </EmptyContent>
                </Empty>
                <div className="flex items-center gap-3">
                  <Spinner />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            )}
          />

          <DualSurfaceShowcase
            title="Overlays & Sidebar (DropdownMenu, Sheet, Drawer, Tooltip, Toast, Sidebar)"
            source="shadcn base-nova"
            useFor="Context menus, side panels, mobile bottom sheets, concise icon labels, non-blocking toasts, and responsive navigation."
            dont="Hand-build custom modals/popovers or nest interactive portals without clean triggers."
            render={() => (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                      Menu
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Edit property</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">Pause account</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger render={<Button variant="outline" size="sm" />}>
                      Sheet
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Side Sheet</SheetTitle>
                        <SheetDescription>
                          Inspect details without leaving the list.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-4">
                        <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} showSwipeHandle>
                    <DrawerTrigger render={<Button variant="outline" size="sm" />}>
                      Drawer
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Mobile Drawer</DrawerTitle>
                        <DrawerDescription>
                          Bottom sheet for thumb reach on phones.
                        </DrawerDescription>
                      </DrawerHeader>
                      <DrawerFooter>
                        <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>

                  <Tooltip>
                    <TooltipTrigger render={<Button variant="outline" size="sm" />}>
                      Tooltip
                    </TooltipTrigger>
                    <TooltipContent>Collapsed rail label</TooltipContent>
                  </Tooltip>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.add({
                        title: 'Saved changes',
                        description: 'Your draft is up to date.',
                        type: 'success',
                      })
                    }
                  >
                    Trigger Toast
                  </Button>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-sidebar p-3 text-sidebar-foreground">
                  <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-accent">
                    <PanelLeftIcon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-medium">Sidebar surface token (`--sidebar`)</p>
                    <p className="text-muted-foreground">
                      Active item preview: <HomeIcon className="inline size-3" aria-hidden="true" />{' '}
                      Home
                    </p>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </TooltipProvider>
    </Toaster>
  );
}
