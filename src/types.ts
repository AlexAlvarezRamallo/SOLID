export type CustomerType = 'standard' | 'premium' | 'vip' | 'employee'
export type PaymentMethod = 'card' | 'paypal' | 'transfer'

export interface Customer {
  id: string
  name: string
  email: string
  type: CustomerType
}

export interface OrderLine {
  sku: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  customer: Customer
  lines: OrderLine[]
  paymentMethod: PaymentMethod
  country: string
}

export interface StoredOrder {
  id: string
  customerId: string
  total: number
  createdAt: string
}

export interface SentEmail {
  to: string
  subject: string
  body: string
}
