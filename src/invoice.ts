import type { Order } from './types.ts'
import type { PricingBreakdown } from './order-pricing.ts'

export interface InvoiceLineData {
  quantity: number
  description: string
  total: number
}

export interface InvoiceData {
  id: string
  customerName: string
  customerEmail: string
  lines: InvoiceLineData[]
  subtotal: number
  discount: number
  fee: number
  shipping: number
  tax: number
  total: number
}

export class InvoiceRenderer {
  render(order: Order, pricing: PricingBreakdown): InvoiceData {
    return {
      id: order.id,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      lines: order.lines.map((line) => ({
        quantity: line.quantity,
        description: line.description,
        total: line.unitPrice * line.quantity,
      })),
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      fee: pricing.fee,
      shipping: pricing.shipping,
      tax: pricing.tax,
      total: pricing.total,
    }
  }
}
