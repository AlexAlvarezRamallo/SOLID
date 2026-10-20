import type { Order } from './types.ts'

export class OrderValidator {
  validate(order: Order): void {
    if (order.lines.length === 0) {
      throw new Error('El pedido no tiene líneas')
    }
    if (!order.customer.email.includes('@')) {
      throw new Error(`Email inválido: ${order.customer.email}`)
    }
    for (const line of order.lines) {
      if (line.quantity <= 0) {
        throw new Error(`Cantidad inválida en ${line.sku}`)
      }
      if (line.unitPrice < 0) {
        throw new Error(`Precio inválido en ${line.sku}`)
      }
    }
  }
}
