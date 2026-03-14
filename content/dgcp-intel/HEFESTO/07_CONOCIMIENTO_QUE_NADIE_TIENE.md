# Conocimiento que Nadie Mas Tiene — Ventaja Competitiva Real

> Fuente: HEFESTO — Experiencia de campo con licitaciones RD
> Fecha: 2026-03-14

---

## Por que este documento

Este es el conocimiento que viene de HACER licitaciones, no de leer la ley. Es lo que separa a DGCP INTEL de cualquier competidor que solo lea la documentacion oficial. Cada punto aqui es una leccion aprendida en la practica.

---

## 1. El Portal SECP No Es Lo Que Parece

### Lo que dice la ley vs lo que pasa

| La ley dice | Lo que realmente pasa |
|-------------|----------------------|
| "Todo proceso se publica en SECP" | Municipios pequenos publican en SECP pero reciben ofertas fisicas |
| "La evaluacion es objetiva" | Los peritos son funcionarios de la misma entidad |
| "4 dias habiles para subsanar" | A veces te avisan el dia 3 |
| "Adjudicacion por menor precio" | "Menor precio de los que cumplen" — el "cumple" es subjetivo |
| "Proceso transparente" | Muchos procesos ya tienen ganador predeterminado |

### El portal se cae en momentos criticos

- En cierres masivos (fin de mes), el portal SECP se vuelve lento
- Los uploads grandes (>50MB) a veces fallan sin error
- La sesion expira sin aviso despues de ~30 minutos
- El boton "Mostrar Interes" a veces no responde al primer click

**Solucion del SaaS**: Playwright debe tener reintentos, screenshots de cada paso, y subir minimo 1 hora antes del cierre.

---

## 2. Como Detectar Procesos Trucados (Ampliado)

### Patron 1: Especificaciones Dirigidas

```
SENAL: El pliego pide especificaciones TAN especificas que solo un proveedor puede cumplir.

EJEMPLO REAL:
  Proceso de pintura que pedia:
  - "Pintura acrilica Gris Claro 26" (codigo de una marca especifica)
  - "Esmalte Grafito 42" (otra marca especifica)
  - "Azul Alba 42" (otra marca)

  Solo un distribuidor en RD tiene esos tres colores exactos.
  → Proceso dirigido.

DETECCION AUTOMATICA:
  - Si el pliego menciona marcas especificas → RED FLAG
  - Si las especificaciones son inusualmente detalladas → WARNING
  - Excepciones: cuando dice "o equivalente" (permitido por ley)
```

### Patron 2: Tiempo Insuficiente Sospechoso

```
SENAL: Proceso publicado con menos de 5 dias habiles para preparar oferta.

EJEMPLO REAL:
  HMP-DAF-CD-2026-0007 — Pintura de hospital
  Publicado: viernes 3PM
  Cierre: martes siguiente 10AM
  → 2 dias habiles para preparar oferta completa de RD$ 1.4M
  → Imposible para quien no tenia los datos desde ANTES de la publicacion

DETECCION AUTOMATICA:
  - dias_habiles(publicacion, cierre) < 5 → RED FLAG alta
  - dias_habiles < 3 → PROBABLEMENTE TRUCADO
```

### Patron 3: Historial de Adjudicaciones

```
SENAL: La misma empresa gana multiples procesos consecutivos de la misma entidad.

DETECCION AUTOMATICA:
  Query OCDS:
    SELECT supplier_name, COUNT(*)
    FROM awards
    WHERE buyer_id = [entidad]
    AND award_date > NOW() - INTERVAL '12 months'
    GROUP BY supplier_name
    HAVING COUNT(*) > 3

  Si un proveedor gano 3+ procesos en 12 meses de la misma entidad → RED FLAG
```

### Patron 4: Presupuesto Irreal

```
SENAL: El presupuesto referencial es imposiblemente bajo o alto.

DETECCION CON BD DE PRECIOS:
  Si el presupuesto < 50% del costo real (BD de precios) → RED FLAG
  Si el presupuesto > 300% del costo real → RED FLAG (inflado)

  Ejemplo: Pintura de 500m² con presupuesto RD$ 50,000
  Costo real: materiales RD$ 105,000 + MO RD$ 38,000 = RD$ 143,000
  → Presupuesto es 35% del costo real → IRREAL
```

### Patron 5: Licitacion "Fantasma"

```
SENAL: Proceso que se publica, recibe ofertas, y luego se declara desierto
       para inmediatamente adjudicar por contratacion directa al "unico disponible".

DETECCION:
  - Proceso declarado desierto
  - Seguido por contratacion directa del MISMO objeto
  - En menos de 30 dias
  → PATRON FANTASMA
```

### Patron 6: Invitados Sospechosos (Comparacion de Precios)

```
SENAL: En comparacion de precios, la entidad invita a 3 empresas.
       Si 2 de las 3 son "relleno" (empresas que siempre pierden),
       la tercera ya sabe que va a ganar.

DETECCION:
  - Buscar empresas que participan frecuentemente como "perdedoras"
  - Si empresa A pierde 80%+ de los procesos donde participa → posible relleno
  - Si empresa A siempre aparece con empresa B → patron sospechoso
```

---

## 3. Trucos de Cotizacion que Funcionan

### El descuento invisible

```
REGLA: NUNCA mostrar una linea de "descuento" en la cotizacion.
RAZON: Si muestras 20% descuento, la entidad espera 20% siempre.

COMO HACERLO:
  1. Calcular costo real: RD$ 100,000
  2. Aplicar margen deseado: 15% → RD$ 115,000
  3. Comparar con referencial: RD$ 150,000
  4. Tu precio ofertado: RD$ 115,000 (sin mencionar descuento)

  El precio que aparece ES el precio. No hay "descuento de X%".
```

### La estrategia de lotes

```
REGLA: Si el proceso tiene multiples lotes, puedes ofertar DIFERENTE margen por lote.

EJEMPLO:
  Lote 1: Aceras El Cacique → presupuesto RD$ 2M → Oferta: RD$ 1.66M (margen 25%)
  Lote 2: Aceras El Mamey → presupuesto RD$ 2.5M → Oferta: RD$ 2.17M (margen 20%)

  Total ofertado: RD$ 3.83M
  Total referencial: RD$ 4.5M

  → Ganaste ambos lotes siendo el menor precio en cada uno
```

### Items con perdida estrategica

```
REGLA: Algunos items pueden tener perdida si el TOTAL es rentable.

EJEMPLO (15 centros de salud):
  13 ubicaciones: rentables (margen 30-50%)
  2 ubicaciones: con perdida (distancia + bajo volumen)

  Total: rentable porque las 13 compensan las 2

  → El SaaS debe mostrar rentabilidad POR ITEM/UBICACION, no solo total
```

---

## 4. El Calendario Oculto de Licitaciones

### Patrones estacionales

| Mes | Actividad | Razon |
|-----|----------|-------|
| Enero-Febrero | BAJA — pocas publicaciones | Inicio de ano fiscal, presupuestos en aprobacion |
| Marzo-Abril | ALTA — explosion de procesos | Presupuestos aprobados, inicio de ejecucion |
| Mayo-Junio | MEDIA — flujo constante | Ejecucion normal |
| Julio-Agosto | BAJA — desaceleracion | Vacaciones, recortes de medio ano |
| Septiembre-Octubre | ALTA — segunda oleada | Prisa por ejecutar presupuesto antes de fin de ano |
| Noviembre-Diciembre | MUY ALTA — urgencia | Cierre fiscal, "hay que gastar el presupuesto" |

### Implicaciones para el SaaS

- **Noviembre-Diciembre**: Alertar al usuario que habra muchos procesos con plazos cortos
- **Enero-Febrero**: Tiempo para preparar perfil, subir documentos, actualizar certificaciones
- **Procesos de fin de ano**: Mayor probabilidad de procesos trucados (prisa por ejecutar)

---

## 5. El Comite de Compras — Quien Decide Realmente

### Composicion real (no lo que dice la ley)

La ley dice que el Comite de Compras decide. En la practica:

| Realidad | Impacto |
|----------|---------|
| El Director/Alcalde (MAE) tiene voto de peso | Si el MAE quiere un proveedor, el Comite lo adjudica |
| Los peritos son sugeridos por el MAE | Los peritos "independientes" no siempre lo son |
| El Encargado de Compras ejecuta, no decide | Sigue instrucciones del MAE |
| El Director Juridico valida la forma, no el fondo | Se asegura que el acto este bien redactado |

### Para el SaaS

- **No alertar sobre esto directamente** (seria acusatorio)
- **Si**: Usar el historial de adjudicaciones para calcular probabilidad real
- **Si**: Detectar patrones de "siempre gana el mismo"
- **Si**: Ajustar win_probability basado en historial de la entidad

---

## 6. Subsanacion — La Segunda Oportunidad

### Lo que nadie te dice sobre subsanacion

```
REGLA OCULTA 1: Si te falta un documento subsanable, NO te descalifican inmediatamente.
  Te dan 4 dias habiles para corregir. PERO te ponen en desventaja
  porque la entidad ve que "no estabas preparado".

REGLA OCULTA 2: Algunos evaluadores son mas estrictos que otros.
  Un evaluador puede aceptar una certificacion DGII del mes anterior.
  Otro puede rechazarla si tiene 3 dias de vencida.

REGLA OCULTA 3: La subsanacion NO aplica a documentos tecnicos.
  Si tu oferta tecnica esta incompleta = DESCALIFICACION.
  No hay segunda oportunidad.
  → El SaaS debe poner bandera ROJA en documentos no subsanables.

REGLA OCULTA 4: El plazo de subsanacion empieza cuando TE NOTIFICAN.
  Si la entidad tarda 3 dias en notificarte, tu plazo empieza el dia 3.
  Pero el plazo es ESTRICTO desde la notificacion.
  → El SaaS debe monitorear notificaciones del portal SECP.
```

---

## 7. Post-Adjudicacion — Donde Se Gana o Pierde Dinero

### El anticipo es clave para MIPYMEs

```
REGLA: Las MIPYMEs tienen derecho a anticipo de 20-50% del monto contratado.
REALIDAD: Muchas entidades tardan 30-60 dias en entregar el anticipo.
PROBLEMA: El contratista ya empezo la obra y esta financiando de su bolsillo.

SOLUCION DEL SaaS:
  - Calcular flujo de caja proyectado
  - Alertar si el anticipo no llega a tiempo
  - Sugerir carta formal de solicitud de anticipo
```

### Las cubicaciones determinan tu flujo de caja

```
REGLA: Cada mes (o segun avance), el contratista presenta una cubicacion
       (informe de avance) y la entidad paga lo correspondiente.

REALIDAD: Las entidades tardan 30-90 dias en pagar cubicaciones.
PROBLEMA: El contratista ejecuta 3 meses de obra antes de ver el primer pago.

DATO PARA EL SaaS:
  - Tracking de cubicaciones presentadas vs pagadas
  - Historial de tiempo de pago por entidad
  - Alerta si una cubicacion lleva 60+ dias sin pago
```

---

## 8. Preguntas Frecuentes del Mundo Real

### "¿Puedo ofertar si no tengo el UNSPSC?"
No. Es descalificacion automatica. Pero puedes agregar codigos UNSPSC a tu RPE en 5-10 dias habiles. El SaaS debe alertar ANTES de que el proceso cierre.

### "¿Puedo ofertar a procesos de MIPYME mujer si no soy mujer?"
No. Si el proceso dice "dirigido a MIPYME mujer", solo pueden participar empresas cuyo representante legal o accionista mayoritaria es mujer. El SaaS filtra esto automaticamente.

### "¿Que pasa si gano y no puedo ejecutar?"
Te ejecutan la garantia de seriedad (1-4% del monto) y te pueden inhabilitar en el RPE. Es una marca negra permanente.

### "¿Puedo participar en multiples procesos simultaneamente?"
Si, no hay limite. Pero cada proceso requiere su propia garantia de seriedad. Si ganas varios, necesitas garantias de fiel cumplimiento para cada uno.

### "¿Que pasa si hay empate en precios?"
Se aplica la regla de desempate del pliego. Tipicamente: empresa local > MIPYME > menor plazo de entrega > sorteo.

### "¿Puedo modificar mi oferta despues de enviarla?"
No. Una vez enviada, es irrevocable. Solo puedes retirarla ANTES del cierre.

### "¿Cuanto cuesta la garantia de seriedad?"
La poliza cuesta aproximadamente 1-3% del monto de la garantia. Es decir, si la garantia es RD$ 40,000 (1% de RD$ 4M), la prima de la poliza es RD$ 400-1,200.

---

## 9. Metricas de Exito por Vertical (benchmarks RD)

### Tasas de adjudicacion tipicas

| Vertical | Tasa de adjudicacion | Competidores promedio |
|----------|---------------------|----------------------|
| Construccion (MIPYME) | 15-25% | 3-6 oferentes |
| Tecnologia/Software | 20-35% | 2-5 oferentes |
| Vigilancia/CCTV | 20-30% | 3-5 oferentes |
| Telecom/Redes | 15-25% | 3-8 oferentes |
| Suministros generales | 10-15% | 5-15 oferentes |
| Servicios especializados | 25-40% | 2-4 oferentes |

### Margenes tipicos por vertical

| Vertical | Margen bruto tipico | Margen neto |
|----------|--------------------|----|
| Construccion | 15-30% | 8-15% |
| Tecnologia/Software | 25-50% | 15-30% |
| Vigilancia/CCTV | 20-40% | 12-25% |
| Telecom/Redes | 20-35% | 10-20% |
| Suministros | 8-20% | 5-12% |
| Servicios | 25-45% | 15-30% |

---

## 10. Features Diferenciadores Basados en Este Conocimiento

| Feature | Basado en | Valor |
|---------|----------|-------|
| Red Flag Engine | Seccion 2 | Evitar procesos trucados |
| Calendario estacional | Seccion 4 | Planificar participacion |
| Historial de entidades | Seccion 5 | Saber quien paga a tiempo |
| Subsanacion auto-alertas | Seccion 6 | No perder por plazo |
| Flujo de caja proyectado | Seccion 7 | Planificar finanzas |
| Precios por vertical | Seccion 3 | Cotizaciones competitivas |
| Win probability ajustada | Seccion 9 | Expectativas realistas |

---

*HEFESTO — "El conocimiento de campo es la forja donde se templa la ventaja competitiva"*
*2026-03-14*
