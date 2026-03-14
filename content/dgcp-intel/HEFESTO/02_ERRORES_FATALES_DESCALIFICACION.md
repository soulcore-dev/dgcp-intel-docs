# Errores Fatales que Descalifican — Guia de Supervivencia

> Fuente: HEFESTO — Experiencia real + analisis de procesos fallidos
> Fecha: 2026-03-14

---

## Por que este documento

Cada error aqui listado ha causado descalificacion real en licitaciones dominicanas. El SaaS debe detectar TODOS estos errores ANTES de que el usuario envie su oferta.

---

## Errores de Descalificacion Inmediata (NO subsanables)

### 1. Oferta tecnica incompleta

| Error | Ejemplo real | Deteccion por SaaS |
|-------|-------------|-------------------|
| No presentar oferta tecnica narrativa | Empresa solo envio formularios sin documento tecnico | Checklist: verificar que existe archivo de oferta tecnica |
| Sin experiencia documentada | No adjuntar D.049 con proyectos similares | Verificar que tenant tiene proyectos cargados |
| Equipo tecnico sin credenciales | Ing. Residente sin colegiatura CODIA | Alertar que se necesitan copias de credenciales |
| Programa de trabajo generico | Copiar-pegar de otro proceso | IA genera especifico para cada proceso |
| Cronograma sin actividades del pliego | Gantt que no refleja las partidas del proceso | Cruzar actividades del Gantt vs items del pliego |

### 2. Oferta presentada fuera de plazo

| Error | Consecuencia | Prevencion SaaS |
|-------|-------------|-----------------|
| Subir 1 minuto despues del cierre | Rechazado automatico por SECP | Alerta 24h, 6h, 1h antes del cierre |
| Confundir hora UTC vs hora RD | Creer que falta 4 horas cuando ya cerro | SIEMPRE mostrar hora RD (UTC-4) |
| Portal saturado en ultimos minutos | No poder subir a tiempo | Recomendar subir 30+ min antes |

### 3. No mostrar interes

| Error | Consecuencia | Prevencion SaaS |
|-------|-------------|-----------------|
| No clickear "Mostrar Interes" en SECP | No poder presentar oferta | F4 lo automatiza con Playwright |
| Mostrar interes despues del periodo | Rechazado | Alertar del periodo de interes |

### 4. UNSPSC incompatible

| Error | Consecuencia | Prevencion SaaS |
|-------|-------------|-----------------|
| RPE no tiene el codigo UNSPSC del proceso | Descalificacion automatica | F2 verifica automaticamente |
| Codigo RPE vencido | No reconocido por SECP | Alertar vencimiento de codigos |

---

## Errores Graves (subsanables pero riesgosos)

### 5. Certificaciones vencidas

| Certificacion | Vigencia tipica | Tiempo de renovacion | Accion SaaS |
|--------------|----------------|---------------------|-------------|
| DGII | 30 dias | Inmediato (online) | Verificar fecha antes de enviar |
| TSS | 30 dias | 1-3 dias | Verificar fecha antes de enviar |
| Registro Mercantil | 1 ano | 5-10 dias | Alertar vencimiento |
| MIPYME | 1 ano | 5-15 dias | Alertar vencimiento |
| RPE | Permanente pero se inactiva | 10 dias | Verificar estado activo |

### 6. Garantia de seriedad incorrecta

| Error | Consecuencia | Prevencion SaaS |
|-------|-------------|-----------------|
| Monto menor al requerido | Rechazada | Calcular exacto: 1% MIPYME / 4% regular |
| Poliza vencida antes de vigencia oferta | Rechazada | Calcular vigencia vs fecha cierre |
| Poliza a nombre incorrecto | Subsanable (4 dias) | Template con datos correctos |
| No presentar garantia | Descalificacion | Alerta temprana (2-4 semanas antes) |

---

## Errores de Coherencia (detectables automaticamente)

### 7. Montos no coinciden entre documentos

```
ERROR TIPICO:
  F.033 dice: RD$ 1,431,788.40
  Cotizacion dice: RD$ 1,431,780.00
  Diferencia: RD$ 8.40 (redondeo ITBIS)

CONSECUENCIA: Puede causar rechazo o pedir subsanacion

DETECCION SaaS:
  Cruzar monto F.033 == monto Cotizacion == monto Oferta Tecnica
  Diferencia > RD$ 1.00 → ERROR BLOQUEANTE
```

### 8. Datos de empresa incorrectos

```
ERROR TIPICO:
  F.034 dice: "Kosmima Investment SRL"
  F.033 dice: "KOSMIMA INVESTMENT, S.R.L."
  Diferencia: Formato del nombre

CONSECUENCIA: Puede causar confusion en evaluacion

DETECCION SaaS:
  Normalizar nombre empresa en todos los documentos
  Usar EXACTAMENTE el nombre del Registro Mercantil
```

### 9. ITBIS mal calculado

```
ERROR TIPICO:
  Subtotal: RD$ 1,213,380.00
  ITBIS 18%: RD$ 218,400.00 (INCORRECTO - deberia ser 218,408.40)
  Total: RD$ 1,431,780.00 (INCORRECTO)

DETECCION SaaS:
  Verificar: subtotal × 0.18 == ITBIS declarado
  Verificar: subtotal + ITBIS == total
```

---

## Errores Estrategicos (no te descalifican pero pierdes)

### 10. Precio por encima del referencial

En la mayoria de procesos, si tu oferta excede el presupuesto referencial, NO te adjudican. No es descalificacion pero pierdes.

### 11. Precio temerario (demasiado bajo)

Si tu oferta esta 50%+ por debajo del referencial, el comite puede:
- Pedirte justificacion de precios
- Rechazar por "precio temerariamente bajo"
- Sospechar de dumping

### 12. No atender subsanacion a tiempo

Si te notifican subsanacion y no respondes en 4 dias habiles → descalificacion. El SaaS debe tener alerta URGENTE con countdown.

---

## Matriz de Deteccion Automatica

| Error | Detectable por SaaS | Momento de deteccion | Tipo de alerta |
|-------|:---:|---|---|
| Oferta tecnica incompleta | Si | Pre-submit (F3B revision) | Bloqueante |
| Fuera de plazo | Si | Countdown permanente | Urgente |
| No mostrar interes | Si | F4 automatiza | Auto-resuelto |
| UNSPSC incompatible | Si | F2 scoring | Bloqueante |
| Certificaciones vencidas | Si | Pre-submit | Bloqueante |
| Garantia incorrecta | Si | Calculo automatico | Bloqueante |
| Montos no coinciden | Si | F3B validacion cruzada | Bloqueante |
| Datos empresa incorrectos | Si | F3B validacion datos | Auto-corregible |
| ITBIS mal calculado | Si | F3B validacion financiera | Auto-corregible |
| Precio > referencial | Si | F2 escenarios | Advertencia |
| Precio temerario | Si | F2 escenarios | Advertencia |
| Subsanacion no atendida | Si | Tracking post-submit | Urgente |

**Resultado**: 12 de 12 errores son detectables. El SaaS los atrapa TODOS antes de enviar.

---

*HEFESTO — "Cada error evitado es una licitacion salvada"*
*2026-03-14*
