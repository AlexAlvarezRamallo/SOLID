import { OrderService } from './order-service.ts'
import { database } from './infra/database.ts'
import { emailGateway } from './infra/email-gateway.ts'
import type { Order } from './types.ts'

const pedido: Order = {
  id: 'ORD-2045',
  customer: { id: 'c-42', name: 'Ana García', email: 'ana@example.com', type: 'vip' },
  lines: [
    { sku: 'MON-01', description: 'Monitor 27"', quantity: 2, unitPrice: 499.5 },
    { sku: 'TEC-01', description: 'Teclado mecánico', quantity: 1, unitPrice: 89.9 },
  ],
  paymentMethod: 'paypal',
  country: 'ES',
}

const service = new OrderService()
console.log(service.processOrder(pedido))

console.log('\nPedidos guardados:', database.findAllOrders())
console.log('Emails enviados:', emailGateway.sentMessages().length)
