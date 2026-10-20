import { beforeEach, describe, expect, it } from 'vitest'
import { OrderService } from '../src/order-service.ts'
import { database } from '../src/infra/database.ts'
import { emailGateway } from '../src/infra/email-gateway.ts'
import type { Customer, Order, OrderLine } from '../src/types.ts'

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'c-1',
    name: 'Ana García',
    email: 'ana@example.com',
    type: 'standard',
    ...overrides,
  }
}

function order(overrides: Partial<Order> = {}): Order {
  const lines: OrderLine[] = [
    { sku: 'TEC-01', description: 'Teclado mecánico', quantity: 2, unitPrice: 25 },
    { sku: 'CAB-07', description: 'Cable USB-C', quantity: 1, unitPrice: 10 },
  ]
  return {
    id: 'ORD-1001',
    customer: customer(),
    lines,
    paymentMethod: 'card',
    country: 'ES',
    ...overrides,
  }
}

describe('OrderService', () => {
  let service: OrderService

  beforeEach(() => {
    database.clear()
    emailGateway.clear()
    service = new OrderService()
  })

  describe('cálculo del total', () => {
    it('cliente estándar: sin descuento, comisión de tarjeta y envío gratis por superar 50 EUR', () => {
      const invoice = service.processOrder(order())

      // 60 subtotal + 0,90 comisión + 0 envío = 60,90 -> +21% IVA = 73,69
      expect(invoice).toContain('TOTAL: 73.69 EUR')
    })

    it('cliente premium: aplica un 10% de descuento', () => {
      const invoice = service.processOrder(order({ customer: customer({ type: 'premium' }) }))

      expect(invoice).toContain('Descuento: -6.00 EUR')
    })

    it('cliente VIP: 20% de descuento por debajo de 1000 EUR', () => {
      const invoice = service.processOrder(order({ customer: customer({ type: 'vip' }) }))

      expect(invoice).toContain('Descuento: -12.00 EUR')
    })

    it('cliente VIP: sube al 25% cuando el subtotal supera los 1000 EUR', () => {
      const invoice = service.processOrder(
        order({
          customer: customer({ type: 'vip' }),
          lines: [{ sku: 'MON-01', description: 'Monitor 27"', quantity: 4, unitPrice: 500 }],
        }),
      )

      expect(invoice).toContain('Descuento: -500.00 EUR')
    })

    it('empleado: aplica un 35% de descuento', () => {
      const invoice = service.processOrder(order({ customer: customer({ type: 'employee' }) }))

      expect(invoice).toContain('Descuento: -21.00 EUR')
    })
  })

  describe('comisiones de pago', () => {
    it('PayPal cobra un 2,9% más 0,30 EUR fijos', () => {
      const invoice = service.processOrder(order({ paymentMethod: 'paypal' }))

      expect(invoice).toContain('Comisión de pago: 2.04 EUR')
    })

    it('la transferencia no tiene comisión', () => {
      const invoice = service.processOrder(order({ paymentMethod: 'transfer' }))

      expect(invoice).toContain('Comisión de pago: 0.00 EUR')
    })
  })

  describe('gastos de envío', () => {
    it('España: 4,95 EUR si no se llega al mínimo', () => {
      const invoice = service.processOrder(
        order({ lines: [{ sku: 'CAB-07', description: 'Cable USB-C', quantity: 1, unitPrice: 10 }] }),
      )

      expect(invoice).toContain('Envío: 4.95 EUR')
    })

    it('Portugal: envío gratis a partir de 80 EUR', () => {
      const invoice = service.processOrder(
        order({
          country: 'PT',
          lines: [{ sku: 'MON-01', description: 'Monitor 27"', quantity: 1, unitPrice: 100 }],
        }),
      )

      expect(invoice).toContain('Envío: 0.00 EUR')
    })

    it('resto del mundo: tarifa plana de 24,95 EUR', () => {
      const invoice = service.processOrder(order({ country: 'US' }))

      expect(invoice).toContain('Envío: 24.95 EUR')
    })
  })

  describe('efectos del pedido', () => {
    it('guarda el pedido en la base de datos', () => {
      service.processOrder(order())

      const stored = database.findAllOrders()
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({ id: 'ORD-1001', customerId: 'c-1', total: 73.69 })
    })

    it('envía un email de confirmación al cliente', () => {
      service.processOrder(order())

      const sent = emailGateway.sentMessages()
      expect(sent).toHaveLength(1)
      expect(sent[0]?.to).toBe('ana@example.com')
      expect(sent[0]?.subject).toBe('Tu pedido ORD-1001 está confirmado')
      expect(sent[0]?.body).toContain('Hola Ana García')
    })

    it('la factura detalla todas las líneas del pedido', () => {
      const invoice = service.processOrder(order())

      expect(invoice).toContain('FACTURA ORD-1001')
      expect(invoice).toContain('2 x Teclado mecánico ... 50.00 EUR')
      expect(invoice).toContain('1 x Cable USB-C ... 10.00 EUR')
    })
  })

  describe('validación', () => {
    it('rechaza pedidos sin líneas', () => {
      expect(() => service.processOrder(order({ lines: [] }))).toThrow('El pedido no tiene líneas')
    })

    it('rechaza emails sin arroba', () => {
      expect(() => service.processOrder(order({ customer: customer({ email: 'ana.example.com' }) }))).toThrow(
        'Email inválido',
      )
    })

    it('rechaza cantidades no positivas', () => {
      expect(() =>
        service.processOrder(
          order({ lines: [{ sku: 'CAB-07', description: 'Cable', quantity: 0, unitPrice: 10 }] }),
        ),
      ).toThrow('Cantidad inválida en CAB-07')
    })
  })

  describe('exportación', () => {
    it('exporta la factura en HTML', () => {
      const html = service.exportInvoice(order(), 'html')

      expect(html.startsWith('<pre>')).toBe(true)
      expect(html).toContain('TOTAL: 73.69 EUR')
    })

    it('exporta las líneas en CSV', () => {
      const csv = service.exportInvoice(order(), 'csv')

      expect(csv).toBe('2 x Teclado mecánico;50.00 EUR\n1 x Cable USB-C;10.00 EUR')
    })
  })
})
