import { database } from './infra/database.ts'
import { emailGateway } from './infra/email-gateway.ts'
import { DefaultInvoiceExporter, type InvoiceExporter } from './invoice-exporter.ts'
import { InvoiceRenderer, type InvoiceData } from './invoice.ts'
import { OrderPricingCalculator, type PricingBreakdown } from './order-pricing.ts'
import { OrderValidator } from './order-validation.ts'
import type { Order } from './types.ts'

export interface OrderRepository {
  insertOrder(order: { id: string; customerId: string; total: number; createdAt: string }): void
}

export interface NotificationGateway {
  send(to: string, subject: string, body: string): void
}

export class OrderService {
  constructor(
    private readonly validator: OrderValidator = new OrderValidator(),
    private readonly pricingCalculator: OrderPricingCalculator = new OrderPricingCalculator(),
    private readonly invoiceRenderer: InvoiceRenderer = new InvoiceRenderer(),
    private readonly invoiceExporter: InvoiceExporter = new DefaultInvoiceExporter(),
    private readonly repository: OrderRepository = database,
    private readonly notifier: NotificationGateway = emailGateway,
  ) {}

  processOrder(order: Order): string {
    const { data, pricing } = this.buildInvoice(order)
    const invoice = this.invoiceExporter.export(data, 'text')

    this.repository.insertOrder({
      id: order.id,
      customerId: order.customer.id,
      total: pricing.total,
      createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    })

    this.notifier.send(
      order.customer.email,
      `Tu pedido ${order.id} está confirmado`,
      `Hola ${order.customer.name},\n\nGracias por tu compra.\n\n${invoice}`,
    )

    return invoice
  }

  exportInvoice(order: Order, format: 'text' | 'html' | 'csv'): string {
    const { data } = this.buildInvoice(order)
    return this.invoiceExporter.export(data, format)
  }

  calculateOrder(order: Order): PricingBreakdown {
    return this.buildInvoice(order).pricing
  }

  private buildInvoice(order: Order): { data: InvoiceData; pricing: PricingBreakdown } {
    this.validator.validate(order)
    const pricing = this.pricingCalculator.calculate(order)
    return { data: this.invoiceRenderer.render(order, pricing), pricing }
  }
}

/*
 * ============================ ANTES ============================
 * Implementación original conservada como comentario para comparar.
 * Esta versión concentraba todas las responsabilidades en OrderService.
 *
 * const TAX_RATE = 0.21
 *
 * export class OrderServiceBefore {
 *   processOrder(order: Order): string {
 *     if (order.lines.length === 0) {
 *       throw new Error('El pedido no tiene líneas')
 *     }
 *     if (!order.customer.email.includes('@')) {
 *       throw new Error(`Email inválido: ${order.customer.email}`)
 *     }
 *     for (const line of order.lines) {
 *       if (line.quantity <= 0) {
 *         throw new Error(`Cantidad inválida en ${line.sku}`)
 *       }
 *       if (line.unitPrice < 0) {
 *         throw new Error(`Precio inválido en ${line.sku}`)
 *       }
 *     }
 *
 *     let subtotal = 0
 *     for (const line of order.lines) {
 *       subtotal += line.unitPrice * line.quantity
 *     }
 *
 *     let discount = 0
 *     switch (order.customer.type) {
 *       case 'standard': discount = 0; break
 *       case 'premium': discount = subtotal * 0.1; break
 *       case 'vip':
 *         discount = subtotal * 0.2
 *         if (subtotal > 1000) discount = subtotal * 0.25
 *         break
 *       case 'employee': discount = subtotal * 0.35; break
 *     }
 *
 *     let fee = 0
 *     const afterDiscount = subtotal - discount
 *     switch (order.paymentMethod) {
 *       case 'card': fee = afterDiscount * 0.015; break
 *       case 'paypal': fee = afterDiscount * 0.029 + 0.3; break
 *       case 'transfer': fee = 0; break
 *     }
 *
 *     let shipping = 0
 *     if (order.country === 'ES') {
 *       shipping = afterDiscount >= 50 ? 0 : 4.95
 *     } else if (order.country === 'PT' || order.country === 'FR') {
 *       shipping = afterDiscount >= 80 ? 0 : 9.95
 *     } else {
 *       shipping = 24.95
 *     }
 *
 *     const taxableBase = afterDiscount + fee + shipping
 *     const tax = taxableBase * TAX_RATE
 *     const total = Math.round((taxableBase + tax) * 100) / 100
 *
 *     let invoice = ''
 *     invoice += `FACTURA ${order.id}\n`
 *     invoice += `Cliente: ${order.customer.name} <${order.customer.email}>\n`
 *     invoice += `${'-'.repeat(40)}\n`
 *     for (const line of order.lines) {
 *       const lineTotal = (line.unitPrice * line.quantity).toFixed(2)
 *       invoice += `${line.quantity} x ${line.description} ... ${lineTotal} EUR\n`
 *     }
 *     invoice += `${'-'.repeat(40)}\n`
 *     invoice += `Subtotal: ${subtotal.toFixed(2)} EUR\n`
 *     invoice += `Descuento: -${discount.toFixed(2)} EUR\n`
 *     invoice += `Comisión de pago: ${fee.toFixed(2)} EUR\n`
 *     invoice += `Envío: ${shipping.toFixed(2)} EUR\n`
 *     invoice += `IVA (21%): ${tax.toFixed(2)} EUR\n`
 *     invoice += `TOTAL: ${total.toFixed(2)} EUR\n`
 *
 *     database.insertOrder({
 *       id: order.id,
 *       customerId: order.customer.id,
 *       total,
 *       createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
 *     })
 *
 *     emailGateway.send(
 *       order.customer.email,
 *       `Tu pedido ${order.id} está confirmado`,
 *       `Hola ${order.customer.name},\n\nGracias por tu compra.\n\n${invoice}`,
 *     )
 *
 *     return invoice
 *   }
 *
 *   exportInvoice(order: Order, format: 'text' | 'html' | 'csv'): string {
 *     const invoice = this.processOrder(order)
 *     if (format === 'text') return invoice
 *     if (format === 'html') return `<pre>${invoice}</pre>`
 *     if (format === 'csv') {
 *       return invoice.split('\n')
 *         .filter((line) => line.includes('...'))
 *         .map((line) => line.replace(' ... ', ';'))
 *         .join('\n')
 *     }
 *     throw new Error(`Formato no soportado: ${format}`)
 *   }
 * }
 *
 * ========================== DESPUÉS ============================
 * OrderService coordina componentes especializados. Las reglas están en
 * order-validation.ts, order-pricing.ts e invoice.ts.
 */
