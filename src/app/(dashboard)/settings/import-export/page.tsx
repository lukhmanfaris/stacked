import { ImportWizard } from '@/components/import-export/import-wizard'
import { ExportOptions } from '@/components/import-export/export-options'
import { Separator } from '@/components/ui/separator'

export default function ImportExportPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Import bookmarks</h2>
          <p className="text-sm text-muted-foreground">
            Import from a browser export, a prior Stacked backup, or a CSV file.
          </p>
        </div>
        <ImportWizard />
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Export bookmarks</h2>
          <p className="text-sm text-muted-foreground">
            Download your bookmarks in your preferred format.
          </p>
        </div>
        <ExportOptions />
      </section>
    </div>
  )
}
