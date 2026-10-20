import type { StoredOrder } from '../types.ts'

/**
 * "Base de datos" en memoria para que el ejemplo se pueda ejecutar sin
 * infraestructura. Se comporta como un repositorio real: guarda y consulta.
 */
class InMemoryDatabase {
  private readonly orders: StoredOrder[] = []

  insertOrder(order: StoredOrder): void {
    this.orders.push(order)
  }

  findAllOrders(): StoredOrder[] {
    return [...this.orders]
  }

  clear(): void {
    this.orders.length = 0
  }
}

export const database = new InMemoryDatabase()
