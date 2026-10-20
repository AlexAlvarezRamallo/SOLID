import type { SentEmail } from '../types.ts'

/**
 * Pasarela de email simulada: en lugar de enviar de verdad, acumula los
 * mensajes para poder inspeccionarlos.
 */
class FakeEmailGateway {
  private readonly outbox: SentEmail[] = []

  send(to: string, subject: string, body: string): void {
    this.outbox.push({ to, subject, body })
  }

  sentMessages(): SentEmail[] {
    return [...this.outbox]
  }

  clear(): void {
    this.outbox.length = 0
  }
}

export const emailGateway = new FakeEmailGateway()
