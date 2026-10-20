import type { InvoiceData } from './invoice.ts'

export type InvoiceFormat = string

export interface InvoiceFormatRenderer {
  render(invoice: InvoiceData): string
}

export interface InvoiceExporter {
  export(invoice: InvoiceData, format: InvoiceFormat): string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeCsv(value: string): string {
  return /[",;\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

export class TextInvoiceRenderer implements InvoiceFormatRenderer {
  render(invoice: InvoiceData): string {
    let text = ''
    text += `FACTURA ${invoice.id}\n`
    text += `Cliente: ${invoice.customerName} <${invoice.customerEmail}>\n`
    text += `${'-'.repeat(40)}\n`
    for (const line of invoice.lines) {
      text += `${line.quantity} x ${line.description} ... ${line.total.toFixed(2)} EUR\n`
    }
    text += `${'-'.repeat(40)}\n`
    text += `Subtotal: ${invoice.subtotal.toFixed(2)} EUR\n`
    text += `Descuento: -${invoice.discount.toFixed(2)} EUR\n`
    text += `Comisión de pago: ${invoice.fee.toFixed(2)} EUR\n`
    text += `Envío: ${invoice.shipping.toFixed(2)} EUR\n`
    text += `IVA (21%): ${invoice.tax.toFixed(2)} EUR\n`
    text += `TOTAL: ${invoice.total.toFixed(2)} EUR\n`
    return text
  }
}

export class HtmlInvoiceRenderer implements InvoiceFormatRenderer {
  constructor(private readonly textRenderer: InvoiceFormatRenderer = new TextInvoiceRenderer()) {}

  render(invoice: InvoiceData): string {
    return `<pre>${escapeHtml(this.textRenderer.render(invoice))}</pre>`
  }
}

export class CsvInvoiceRenderer implements InvoiceFormatRenderer {
  render(invoice: InvoiceData): string {
    return invoice.lines
      .map((line) => `${escapeCsv(`${line.quantity} x ${line.description}`)};${escapeCsv(`${line.total.toFixed(2)} EUR`)}`)
      .join('\n')
  }
}

export class DefaultInvoiceExporter implements InvoiceExporter {
  private readonly renderers: ReadonlyMap<string, InvoiceFormatRenderer>

  constructor(renderers?: ReadonlyMap<string, InvoiceFormatRenderer>) {
    this.renderers = renderers ?? new Map([
      ['text', new TextInvoiceRenderer()],
      ['html', new HtmlInvoiceRenderer()],
      ['csv', new CsvInvoiceRenderer()],
    ])
  }

  export(invoice: InvoiceData, format: InvoiceFormat): string {
    const renderer = this.renderers.get(format)
    if (!renderer) {
      throw new Error(`Formato no soportado: ${format}`)
    }
    return renderer.render(invoice)
  }
}
