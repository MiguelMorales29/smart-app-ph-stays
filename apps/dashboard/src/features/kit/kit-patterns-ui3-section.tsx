import { useMemo, useState } from 'react';
import { Badge } from '@smartapp/ui/components/badge';
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridTable,
  dataGridFeatures,
  useTable,
  type ColumnDef,
  type DataGridFeatures,
  type SortingState,
} from '@smartapp/ui/components/reui/data-grid';
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanOverlay,
  restrictToWindowEdges,
} from '@smartapp/ui/components/reui/kanban';
import { BookingStatusBadge } from '@smartapp/ui/compositions/status-badge';
import { useHiddenBelow } from '@smartapp/ui/hooks/use-hidden-below';
import { ThermalReceiptCard } from '@smartapp/ui/vendor/opensource-ui/thermal-receipt';
import { GripVerticalIcon } from 'lucide-react';

interface BookingRow {
  readonly id: string;
  readonly guest: string;
  readonly unit: string;
  readonly dates: string;
  readonly total: string;
  readonly status: 'held' | 'in_review' | 'confirmed' | 'checked_in';
}

const BOOKING_ROWS: BookingRow[] = [
  {
    id: 'BK-2041',
    guest: 'Miguel Santos',
    unit: 'Studio Fog',
    dates: '12–14 Dec',
    total: '₱5,700',
    status: 'in_review',
  },
  {
    id: 'BK-2042',
    guest: 'Ana Reyes',
    unit: '1BR Taal View',
    dates: '14–16 Dec',
    total: '₱7,300',
    status: 'confirmed',
  },
  {
    id: 'BK-2043',
    guest: 'Carlo Mendoza',
    unit: 'Garden Suite',
    dates: '18–19 Dec',
    total: '₱3,400',
    status: 'held',
  },
  {
    id: 'BK-2044',
    guest: 'Bea Lim',
    unit: 'Studio Fog',
    dates: '10–12 Dec',
    total: '₱5,700',
    status: 'checked_in',
  },
];

interface BoardCard {
  readonly id: string;
  readonly guest: string;
  readonly unit: string;
  readonly amount: string;
}

const INITIAL_BOARD: Record<string, BoardCard[]> = {
  held: [
    { id: 'c1', guest: 'Carlo Mendoza', unit: 'Garden Suite · 1 night', amount: '₱3,400' },
    { id: 'c2', guest: 'Paolo Cruz', unit: 'Studio Fog · 2 nights', amount: '₱5,700' },
    { id: 'c3', guest: 'Lia Dizon', unit: '1BR Taal View · 2 nights', amount: '₱7,300' },
    { id: 'c4', guest: 'Rico Tan', unit: 'Studio Fog · 1 night', amount: '₱3,100' },
  ],
  in_review: [
    { id: 'c5', guest: 'Miguel Santos', unit: 'Studio Fog · 2 nights', amount: '₱5,700' },
  ],
  confirmed: [
    { id: 'c6', guest: 'Ana Reyes', unit: '1BR Taal View · 2 nights', amount: '₱7,300' },
    { id: 'c7', guest: 'Bea Lim', unit: 'Studio Fog · 2 nights', amount: '₱5,700' },
  ],
};

const COLUMN_LABELS: Record<string, string> = {
  held: 'Held',
  in_review: 'In review',
  confirmed: 'Confirmed',
};

function BookingsDataGridDemo() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<DataGridFeatures, BookingRow, unknown>[]>(
    () => [
      {
        id: 'guest',
        accessorKey: 'guest',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Guest" />,
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      {
        id: 'unit',
        accessorKey: 'unit',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unit" />,
        cell: (info) => <span>{String(info.getValue())}</span>,
      },
      {
        id: 'dates',
        accessorKey: 'dates',
        header: () => <span>Dates</span>,
        cell: (info) => (
          <span className="tabular text-muted-foreground">{String(info.getValue())}</span>
        ),
      },
      {
        id: 'total',
        accessorKey: 'total',
        header: () => <span>Total</span>,
        cell: (info) => <span className="font-medium tabular">{String(info.getValue())}</span>,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => <span>Status</span>,
        cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: BOOKING_ROWS,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row) => row.id,
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <DataGrid table={table} recordCount={BOOKING_ROWS.length} tableLayout={{ dense: true }}>
        <DataGridTable />
      </DataGrid>
    </div>
  );
}

function BoardColumnList({
  columnId,
  items,
}: {
  readonly columnId: string;
  readonly items: readonly BoardCard[];
}) {
  const [scrollRef, hiddenBelow] = useHiddenBelow<HTMLDivElement>();

  return (
    <KanbanColumn
      value={columnId}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-muted/60 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{COLUMN_LABELS[columnId] ?? columnId}</span>
        <Badge variant="secondary" className="tabular">
          {items.length}
        </Badge>
      </div>
      <div ref={scrollRef} className="max-h-52 space-y-2 overflow-y-auto pr-0.5">
        <KanbanColumnContent value={columnId} className="gap-2">
          {items.map((card) => (
            <KanbanItem
              key={card.id}
              value={card.id}
              className="rounded-lg border border-border bg-card p-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{card.guest}</p>
                  <p className="truncate text-xs text-muted-foreground">{card.unit}</p>
                </div>
                <GripVerticalIcon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-xs font-semibold tabular">{card.amount}</p>
            </KanbanItem>
          ))}
        </KanbanColumnContent>
      </div>
      {hiddenBelow > 0 ? (
        <p className="text-center text-xs font-medium text-muted-foreground tabular">
          +{hiddenBelow} more
        </p>
      ) : null}
    </KanbanColumn>
  );
}

function BookingsKanbanDemo() {
  const [columns, setColumns] = useState<Record<string, BoardCard[]>>(INITIAL_BOARD);
  const allCards = useMemo(() => {
    const map = new Map<string, BoardCard>();
    for (const list of Object.values(columns)) {
      for (const card of list) map.set(card.id, card);
    }
    return map;
  }, [columns]);

  return (
    <Kanban
      value={columns}
      onValueChange={setColumns}
      getItemValue={(item) => item.id}
      modifiers={[restrictToWindowEdges]}
    >
      <KanbanBoard className="grid-cols-1 sm:grid-cols-3">
        {Object.entries(columns).map(([columnId, items]) => (
          <BoardColumnList key={columnId} columnId={columnId} items={items} />
        ))}
      </KanbanBoard>
      <KanbanOverlay>
        {({ value }) => {
          const card = allCards.get(String(value));
          if (!card) return null;
          return (
            <div className="rounded-lg border border-primary bg-card p-3 shadow-md">
              <p className="text-sm font-medium">{card.guest}</p>
              <p className="text-xs text-muted-foreground">{card.unit}</p>
            </div>
          );
        }}
      </KanbanOverlay>
    </Kanban>
  );
}

/** UI-3 data grid, kanban board, useHiddenBelow and ThermalReceiptCard in Dashboard `/kit` Patterns tab. */
export function KitPatternsUi3Section() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">
            DataGrid (@reui/data-grid · TanStack Table 9.3.1)
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            The single table primitive for bookings, guests, and payments (Phase 8). Supports
            sorting, column visibility, pinning, and virtualised rows.
          </p>
        </div>
        <BookingsDataGridDemo />
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">
            Kanban &amp; useHiddenBelow (@reui/kanban · @dnd-kit/modifiers 9.0.0)
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Bookings board with window-edge drag modifiers and automatic &ldquo;+N more&rdquo;
            overflow counts on tall columns. Always pair drag moves with keyboard/button actions.
          </p>
        </div>
        <BookingsKanbanDemo />
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">
            ThermalReceiptCard (vendor/opensource-ui · MIT)
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Paper booking and payment receipt slip using our warm paper tokens (`--paper`,
            `--paper-foreground`) and torn edges in both light and dark modes.
          </p>
        </div>
        <div className="max-w-xs py-2">
          <ThermalReceiptCard
            propertyName="ULAP SUITES"
            propertyAddress="Maharlika West, Tagaytay City"
            bookingRef="BK-2041"
            date="10 Dec 2026"
            items={[
              { key: 'stay', name: 'Studio Fog · 2 nights', price: '₱5,200' },
              { key: 'cleaning', name: 'Cleaning fee', price: '₱500' },
            ]}
            subtotalLabel="Stay subtotal"
            subtotal="₱5,200"
            feesLabel="Required fees"
            fees="₱500"
            totalLabel="Total paid (GCash)"
            total="₱5,700"
            footer="Official booking receipt · Show at check-in (2:00 PM Manila time)"
          />
        </div>
      </section>
    </div>
  );
}
