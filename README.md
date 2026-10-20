# Ejercicio SOLID con IA

## PedidoExpress

Este proyecto es un ejercicio práctico para analizar y refactorizar un servicio de pedidos aplicando principios SOLID con ayuda de inteligencia artificial.

El código inicial concentraba en `OrderService` la validación del pedido, el cálculo de precios, los descuentos, las comisiones, el envío, la generación de facturas, la persistencia y el envío de emails.

El objetivo era mejorar el diseño sin cambiar el comportamiento funcional y manteniendo las pruebas existentes en verde.

## Objetivos del ejercicio

- Detectar incumplimientos del principio SRP (Single Responsibility Principle).
- Detectar puntos difíciles de extender según OCP (Open/Closed Principle).
- Separar reglas de negocio, presentación e infraestructura.
- Aplicar inyección de dependencias y abstracciones.
- Mantener los 18 tests existentes sin modificarlos.
- Verificar el resultado con TypeScript y Vitest.

## Estado inicial

La clase original `OrderService` hacía todo el trabajo del caso de uso:

1. Validaba el pedido.
2. Calculaba el subtotal.
3. Aplicaba descuentos por tipo de cliente.
4. Calculaba comisiones por método de pago.
5. Calculaba los gastos de envío.
6. Aplicaba impuestos.
7. Generaba la factura en texto.
8. Guardaba el pedido.
9. Enviaba un email.
10. Exportaba la factura a otros formatos.

Esto provocaba que una modificación en precios, facturación, persistencia o notificaciones obligara a modificar la misma clase.

## Prompts utilizados con IA

### 1. Análisis inicial

```text
Revisa el código sin realizar ningún cambio y dime qué no cumple el sistema SOLID.
Identifica los problemas indicando el principio afectado y las líneas de código.
```

### 2. Diseño de la refactorización

```text
Enséñame cómo tienes pensado realizar la refactorización para aplicar SOLID.
No realices cambios hasta que te dé permiso y conserva el comportamiento actual.
El proyecto debe seguir pasando los 18 tests existentes.
```

### 3. Implementación

```text
Realiza los cambios para mejorar el diseño aplicando SOLID.
Mantén la compatibilidad con los tests actuales y conserva comentada la referencia
de la implementación anterior para poder comparar el antes y el después.
```

### 4. Validación

```text
Ejecuta el typecheck y los tests antes de finalizar.
El resultado esperado es que los 18 tests continúen en verde.
```

### 5. Autoevaluación

```text
Revisa de nuevo la refactorización de forma crítica.
Indica qué partes cumplen realmente SRP y OCP, cuáles no y por qué.
No realices cambios durante la revisión.
```

## Estructura después de la refactorización

```text
src/
  types.ts                 Modelos de dominio
  order-service.ts         Orquestación del caso de uso
  order-validation.ts      Validación de pedidos
  order-pricing.ts         Cálculo de precios y políticas de negocio
  invoice.ts               Modelo y ensamblado de datos de factura
  invoice-exporter.ts      Exportadores de texto, HTML y CSV
  demo.ts                  Ejemplo ejecutable
  infra/
    database.ts            Persistencia en memoria
    email-gateway.ts       Gateway de email simulado

test/
  order-service.test.ts    18 pruebas de comportamiento
```

## Aplicación de SOLID

### SRP — Responsabilidad Única

Las responsabilidades se separaron en componentes especializados:

- `OrderValidator` valida los pedidos.
- `OrderPricingCalculator` calcula los importes.
- Las políticas de descuento, pago y envío contienen las reglas específicas.
- `InvoiceRenderer` transforma el pedido calculado en datos de factura.
- `TextInvoiceRenderer`, `HtmlInvoiceRenderer` y `CsvInvoiceRenderer` generan cada formato.
- `OrderService` coordina el caso de uso.

### OCP — Abierto/Cerrado

Los descuentos, métodos de pago y reglas de envío se representan mediante políticas. Los formatos de factura se registran mediante renderers.

Para añadir un nuevo formato, se puede crear otro renderer sin volver a analizar texto ni modificar la lógica de los formatos existentes.

### DIP — Inversión de Dependencias

`OrderService` recibe abstracciones para el repositorio, las notificaciones y la exportación de facturas. Esto permite sustituir las implementaciones concretas durante las pruebas o en otro entorno.

## Comportamiento mejorado

La exportación de una factura ya no procesa nuevamente el pedido. Por tanto, `exportInvoice()` no guarda otra vez el pedido ni envía emails duplicados.

Además:

- La factura se representa como datos estructurados.
- El CSV no depende de analizar el texto de la factura.
- El HTML escapa los valores para evitar insertar contenido HTML no deseado.

## Ejecución

Requisitos: Node.js 22 o superior.

```bash
npm install
npm test
npm run typecheck
npm run demo
```

## Resultado esperado

```text
Test Files  1 passed (1)
Tests       18 passed (18)
```

El comando `npm run typecheck` también debe finalizar sin errores.

## Criterios de aceptación

- Los 18 tests existentes permanecen en verde.
- El código compila con TypeScript sin errores.
- `OrderService` no contiene todas las reglas de negocio.
- Las reglas de cálculo están separadas de la generación de formatos.
- La exportación no provoca persistencia ni notificaciones duplicadas.
- La implementación anterior queda documentada en `order-service.ts` para comparar el antes y el después.

## Conclusión

El ejercicio muestra cómo utilizar IA como apoyo para:

1. Analizar una implementación existente.
2. Identificar incumplimientos de SOLID.
3. Diseñar una refactorización antes de tocar el código.
4. Implementar cambios de forma incremental.
5. Revisar críticamente la solución.
6. Validar que el comportamiento existente sigue funcionando mediante tests.
