# E01 — Contexto Legal y Regulatorio

> DGCP INTEL | Etapa 1 — Análisis | Investigación: 2026-03-13

---

## 1. Marco Legal Vigente

```mermaid
timeline
    title Evolución Legal — Contrataciones Públicas RD
    2006 : Ley 340-06 (base)
         : Ley 449-06 (modificación)
    2012 : Decreto 543-12 (reglamento)
    2023 : Decreto 416-23 (nuevo reglamento)
         : Vigente desde marzo 2024
    2025 : Ley 47-25 promulgada (28 julio)
    2026 : Ley 47-25 en vigor (24 enero)
         : ESTADO ACTUAL
```

### Ley 47-25 — La que rige hoy (24-01-2026)
Principal reforma estructural del sistema. Cambios clave:
- Incluye Poder Legislativo, Judicial, empresas públicas >50% Estado
- Presupuesto MIPYMEs: aumenta de 20% → **30%** de compras
- Integra IA y blockchain (en progreso)
- Introduce 8 nuevas modalidades de contratación
- Mantiene DGCP como órgano rector

---

## 2. Entidades del Ecosistema

```mermaid
graph TD
    DGCP["DGCP\n(Órgano Rector)"]
    SECP["SECP\n(Sistema Electrónico)"]
    MOPC["MOPC\n(mayor comprador obras)"]
    MIN["Ministerios\n(compradores)"]
    MUN["Municipalidades\n(compradores)"]
    EMPRESA["Empresa pública >50%\n(Ley 47-25)"]
    PROV["Proveedor RPE\n(oferente)"]
    DGII["DGII\n(valida RNC/fiscal)"]
    TSS["TSS\n(valida seg. social)"]

    DGCP -->|regula| SECP
    SECP -->|publica| MOPC
    SECP -->|publica| MIN
    SECP -->|publica| MUN
    SECP -->|publica| EMPRESA
    PROV -->|aplica via| SECP
    PROV -->|verifica en| DGII
    PROV -->|verifica en| TSS

    style DGCP fill:#1a1a2e,color:#00d4ff
    style SECP fill:#16213e,color:#7c3aed
    style PROV fill:#16213e,color:#10b981
```

---

## 3. Modalidades de Contratación para Obras

Umbrales según Resolución PNP-01-2025 (vigente 2025, nuevos en 2026 por Ley 47-25):

```mermaid
graph LR
    subgraph OBRAS["OBRAS — Modalidades por Monto"]
        CP["Comparación de Precios\nRD$49.6M – RD$186M\n20 días hábiles apertura"]
        SO["Sorteo de Obras\nRD$186M – RD$310M\n20-25 días hábiles"]
        LPN["Licitación Pública Nacional\nRD$411M+\n30+ días hábiles\n2 periódicos nacionales"]
        LPI["Licitación Pública Internacional\nMontos muy altos\n+ publicación extranjera"]
    end

    CP --> SO --> LPN --> LPI
```

### Modalidades nuevas Ley 47-25 (vigentes desde 2026)
| Modalidad | Descripción |
|-----------|-------------|
| Licitación Pública Abreviada | Bienes/servicios comunes — plazos reducidos |
| Acuerdos Marco | Precalificación de proveedores |
| Subasta Inversa Electrónica | Competencia por precio mínimo |
| Sorteo de Obras Menores | Nueva — obras pequeña cuantía |
| Contratación Simplificada | Procedimiento ágil, circunstancias específicas |
| Contratación Directa | Justificada, con umbral definido |
| Asociación para Innovación | Soluciones innovadoras |
| Contratación en Atención a Resultados | Orientada a outcomes |

---

## 4. Ciclo de Vida de una Licitación Pública de Obras

```mermaid
sequenceDiagram
    participant E as Entidad Compradora
    participant SECP as Portal SECP
    participant P as Proveedor (RPE)
    participant C as Comisión Evaluación

    E->>SECP: Publicar proceso + pliego
    Note over SECP: 2 periódicos + portal<br/>Mínimo 30 días hábiles

    P->>SECP: Descargar pliego / estudiar
    P->>P: Preparar Sobre A (técnico)
    P->>P: Preparar Sobre B (económico, cerrado)
    P->>SECP: Subir oferta antes del deadline

    SECP->>C: Acto de apertura público (Notario)
    C->>C: Abrir Sobre A (técnico) — 10-20 días
    C->>C: Abrir Sobre B solo calificados — 5-15 días
    C->>SECP: Publicar informe evaluación
    Note over SECP: 5 días hábiles reclamos

    SECP->>P: Notificación adjudicación
    P->>E: Garantía fiel cumplimiento (5-10%)
    E->>P: Firma de contrato
    Note over E,P: Total: 65-100 días (2.5-4 meses)
```

---

## 5. Documentos Requeridos para Participar

### Fase registro RPE (una vez)
- RNC vigente (DGII)
- Certificación fiscal DGII (sin deuda)
- Certificación TSS (si tiene empleados)
- Certificación bancaria firmada y sellada
- Constancia RPE (gratuita, 10 días hábiles)

### Fase participación (por licitación)
| Documento | Tipo | Cuándo |
|-----------|------|--------|
| Constancia RPE vigente | Obligatorio | Siempre |
| Garantía de seriedad de oferta | Obligatorio | 1-3% del monto ofertado |
| Propuesta técnica (Sobre A) | Obligatorio | Siempre |
| Propuesta económica (Sobre B) | Obligatorio | Siempre |
| Carta de presentación | Obligatorio | Siempre |
| Experiencia en obras similares | Variable | Según pliego |
| CV personal técnico responsable | Variable | Según pliego |
| Seguros vigentes | Variable | Según pliego |

### Fase post-adjudicación
- Garantía de fiel cumplimiento (5-10% del monto adjudicado; MIPYMEs: 1%)
- Pólizas de seguros
- Plan de ejecución de obra
- Cronograma de trabajo detallado

---

## 6. Implicaciones para DGCP INTEL

| Hecho legal | Impacto en sistema |
|-------------|-------------------|
| Ley 47-25 activa — 8 nuevas modalidades | Scoring engine debe reconocer todas las modalidades |
| Umbrales se actualizan cada enero | Tabla de umbrales debe ser configurable, no hardcoded |
| Proceso dura 65-100 días | Pipeline tracking de largo plazo por licitación |
| Sobre A y B son separados | Generador de propuestas debe producir ambos documentos |
| Garantías obligatorias | Checklist legal debe alertar de garantías requeridas |
| Ley 47-25 amplía entidades cubiertas | Monitoreo debe incluir empresas públicas + Poder Judicial/Legislativo |
| MIPYMEs tienen 30% cupo garantizado | Segmento prioritario para el SaaS |

---

*Siguiente: [02_ECOSISTEMA_DGCP.md](02_ECOSISTEMA_DGCP.md)*
*JANUS — 2026-03-13*
