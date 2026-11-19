import { contrastRatio } from '@smartapp/core';
import { Badge } from '@smartapp/ui/components/badge';
import { Separator } from '@smartapp/ui/components/separator';

interface TokenPairSpec {
  readonly pair: string;
  readonly fgVar: string;
  readonly fgHexLight: string;
  readonly bgHexLight: string;
  readonly fgHexDark: string;
  readonly bgHexDark: string;
  readonly minRatio: number;
}

const TOKEN_PAIRS: readonly TokenPairSpec[] = [
  {
    pair: '--foreground on --background',
    fgVar: '--foreground',
    fgHexLight: '#0B1633',
    bgHexLight: '#F9FAFD',
    fgHexDark: '#EEF0F4',
    bgHexDark: '#1B1E24',
    minRatio: 4.5,
  },
  {
    pair: '--muted-foreground on --card',
    fgVar: '--muted-foreground',
    fgHexLight: '#5C6372',
    bgHexLight: '#FFFFFF',
    fgHexDark: '#9FA5B0',
    bgHexDark: '#23262D',
    minRatio: 4.5,
  },
  {
    pair: '--primary-foreground on --primary',
    fgVar: '--primary',
    fgHexLight: '#FFFFFF',
    bgHexLight: '#2866EE',
    fgHexDark: '#060E25',
    bgHexDark: '#74A2FF',
    minRatio: 4.5,
  },
  {
    pair: '--primary-hover on --primary-tint',
    fgVar: '--primary-hover',
    fgHexLight: '#194FC9',
    bgHexLight: '#E4EDFF',
    fgHexDark: '#A1C1FF',
    bgHexDark: '#1E3666',
    minRatio: 4.5,
  },
  {
    pair: '--brand-accent-foreground on --brand-accent',
    fgVar: '--brand-accent',
    fgHexLight: '#0B1633',
    bgHexLight: '#7ED6AC',
    fgHexDark: '#060E25',
    bgHexDark: '#40BE8A',
    minRatio: 4.5,
  },
  {
    pair: '--success on --success-tint',
    fgVar: '--success',
    fgHexLight: '#007031',
    bgHexLight: '#DAF5DE',
    fgHexDark: '#50BF6F',
    bgHexDark: '#193B22',
    minRatio: 4.5,
  },
  {
    pair: '--warning on --warning-tint',
    fgVar: '--warning',
    fgHexLight: '#7D5200',
    bgHexLight: '#FEE9CE',
    fgHexDark: '#DB9400',
    bgHexDark: '#47300C',
    minRatio: 4.5,
  },
  {
    pair: '--info on --info-tint',
    fgVar: '--info',
    fgHexLight: '#006393',
    bgHexLight: '#DCF0FF',
    fgHexDark: '#4FAEEB',
    bgHexDark: '#133951',
    minRatio: 4.5,
  },
  {
    pair: '--destructive on --danger-tint',
    fgVar: '--destructive',
    fgHexLight: '#AC111F',
    bgHexLight: '#FFE6E4',
    fgHexDark: '#FF716B',
    bgHexDark: '#542523',
    minRatio: 4.5,
  },
  {
    pair: '--input on --muted (UI 3:1)',
    fgVar: '--input',
    fgHexLight: '#83899A',
    bgHexLight: '#EDF0F6',
    fgHexDark: '#737985',
    bgHexDark: '#2A2E36',
    minRatio: 3.0,
  },
];

export function KitTokensTab() {
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">Platform Colours & Live Contrast</h2>
          <p className="text-xs text-muted-foreground">
            <strong className="font-medium text-foreground">Use for:</strong> Semantic surface,
            text, and status tokens mapped through CSS variables in <code>tokens.css</code>.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong className="font-medium text-foreground">Don&apos;t:</strong> Hardcode raw hex
            values in components or pair <code>text-primary</code> directly onto{' '}
            <code>bg-primary-tint</code> (use <code>text-primary-hover</code>).
          </p>
        </div>
        <Separator />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Token pair</th>
                <th className="py-2 pr-4 font-medium">Light</th>
                <th className="py-2 pr-4 font-medium">Dark</th>
                <th className="py-2 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TOKEN_PAIRS.map((row) => {
                const lightRatio = contrastRatio(row.fgHexLight, row.bgHexLight);
                const darkRatio = contrastRatio(row.fgHexDark, row.bgHexDark);
                return (
                  <tr key={row.pair}>
                    <td className="py-2.5 pr-4 font-mono">{row.pair}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium tabular"
                        style={{ backgroundColor: row.bgHexLight, color: row.fgHexLight }}
                      >
                        {lightRatio.toFixed(2)}:1
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium tabular"
                        style={{ backgroundColor: row.bgHexDark, color: row.fgHexDark }}
                      >
                        {darkRatio.toFixed(2)}:1
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground tabular">&gt;= {row.minRatio}:1</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">
            Type Scale (Plus Jakarta Sans Variable), Radii, Shadows & Motion
          </h2>
          <p className="text-xs text-muted-foreground">
            <strong className="font-medium text-foreground">Use for:</strong> Consistent typographic
            hierarchy, tabular peso/booking figures, and reduced-motion-safe transitions.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong className="font-medium text-foreground">Don&apos;t:</strong> Load storefront
            property fonts in the dashboard or bypass <code>prefers-reduced-motion</code> durations.
          </p>
        </div>
        <Separator />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Typography</p>
            <p className="font-heading text-2xl font-semibold tracking-tight">
              Heading 2xl (24 px)
            </p>
            <p className="font-heading text-lg font-semibold">Heading lg (18 px)</p>
            <p className="text-sm">Body sm (14 px) · Regular UI copy</p>
            <p className="text-xs text-muted-foreground tabular">
              Caption xs (12 px) · Tabular amount ₱12,450
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Radii, Shadows & Durations</p>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-sm border border-border bg-background px-3 py-2 text-xs shadow-sm">
                sm / shadow-sm
              </div>
              <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md">
                md / shadow-md
              </div>
              <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-lg">
                xl / shadow-lg
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">--dur-fast: 120ms</Badge>
              <Badge variant="outline">--dur-base: 200ms</Badge>
              <Badge variant="outline">--dur-slow: 320ms</Badge>
              <Badge variant="outline">--ease-enter</Badge>
              <Badge variant="outline">--ease-exit</Badge>
              <Badge variant="outline">--ease-spring</Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
