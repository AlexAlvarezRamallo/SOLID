import type { CustomerType, Order, PaymentMethod } from './types.ts'

export interface PricingBreakdown {
  subtotal: number
  discount: number
  fee: number
  shipping: number
  tax: number
  total: number
}

export interface DiscountPolicy {
  supports(customerType: CustomerType): boolean
  calculate(subtotal: number): number
}

class StandardDiscount implements DiscountPolicy {
  supports(customerType: CustomerType): boolean { return customerType === 'standard' }
  calculate(_subtotal: number): number { return 0 }
}

class PremiumDiscount implements DiscountPolicy {
  supports(customerType: CustomerType): boolean { return customerType === 'premium' }
  calculate(subtotal: number): number { return subtotal * 0.1 }
}

class VipDiscount implements DiscountPolicy {
  supports(customerType: CustomerType): boolean { return customerType === 'vip' }
  calculate(subtotal: number): number { return subtotal * (subtotal > 1000 ? 0.25 : 0.2) }
}

class EmployeeDiscount implements DiscountPolicy {
  supports(customerType: CustomerType): boolean { return customerType === 'employee' }
  calculate(subtotal: number): number { return subtotal * 0.35 }
}

export interface PaymentFeePolicy {
  supports(paymentMethod: PaymentMethod): boolean
  calculate(amountAfterDiscount: number): number
}

class CardFee implements PaymentFeePolicy {
  supports(paymentMethod: PaymentMethod): boolean { return paymentMethod === 'card' }
  calculate(amountAfterDiscount: number): number { return amountAfterDiscount * 0.015 }
}

class PaypalFee implements PaymentFeePolicy {
  supports(paymentMethod: PaymentMethod): boolean { return paymentMethod === 'paypal' }
  calculate(amountAfterDiscount: number): number { return amountAfterDiscount * 0.029 + 0.3 }
}

class TransferFee implements PaymentFeePolicy {
  supports(paymentMethod: PaymentMethod): boolean { return paymentMethod === 'transfer' }
  calculate(_amountAfterDiscount: number): number { return 0 }
}

interface ShippingPolicy {
  supports(country: string): boolean
  calculate(amountAfterDiscount: number): number
}

class SpainShipping implements ShippingPolicy {
  supports(country: string): boolean { return country === 'ES' }
  calculate(amountAfterDiscount: number): number { return amountAfterDiscount >= 50 ? 0 : 4.95 }
}

class PortugalOrFranceShipping implements ShippingPolicy {
  supports(country: string): boolean { return country === 'PT' || country === 'FR' }
  calculate(amountAfterDiscount: number): number { return amountAfterDiscount >= 80 ? 0 : 9.95 }
}

class RestOfWorldShipping implements ShippingPolicy {
  supports(_country: string): boolean { return true }
  calculate(_amountAfterDiscount: number): number { return 24.95 }
}

const TAX_RATE = 0.21

export class OrderPricingCalculator {
  constructor(
    private readonly discountPolicies: DiscountPolicy[] = [
      new StandardDiscount(),
      new PremiumDiscount(),
      new VipDiscount(),
      new EmployeeDiscount(),
    ],
    private readonly paymentFeePolicies: PaymentFeePolicy[] = [
      new CardFee(),
      new PaypalFee(),
      new TransferFee(),
    ],
    private readonly shippingPolicies: ShippingPolicy[] = [
      new SpainShipping(),
      new PortugalOrFranceShipping(),
      new RestOfWorldShipping(),
    ],
  ) {}

  calculate(order: Order): PricingBreakdown {
    const subtotal = order.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
    const discountPolicy = this.discountPolicies.find((policy) => policy.supports(order.customer.type))
    const discount = discountPolicy?.calculate(subtotal) ?? 0
    const afterDiscount = subtotal - discount
    const paymentFeePolicy = this.paymentFeePolicies.find((policy) => policy.supports(order.paymentMethod))
    const fee = paymentFeePolicy?.calculate(afterDiscount) ?? 0
    const shippingPolicy = this.shippingPolicies.find((policy) => policy.supports(order.country))
    const shipping = shippingPolicy?.calculate(afterDiscount) ?? 0
    const taxableBase = afterDiscount + fee + shipping
    const tax = taxableBase * TAX_RATE
    const total = Math.round((taxableBase + tax) * 100) / 100
    return { subtotal, discount, fee, shipping, tax, total }
  }
}
