# Formularios DGCP — Especificacion Campo por Campo

> Fuente: HEFESTO — Formularios reales completados para KOSMIMA
> Fecha: 2026-03-14

---

## Por que este documento

Para que el SaaS genere formularios automaticamente, necesita saber EXACTAMENTE que va en cada campo. Este documento especifica cada formulario del DGCP con todos sus campos, fuentes de datos y reglas de validacion.

---

## SNCC.F.034 — Presentacion de Oferta

### Proposito
Carta formal de presentacion de la oferta. Declara intencion de participar y cumplir con el pliego.

### Campos

| # | Campo | Fuente de datos | Ejemplo |
|---|-------|----------------|---------|
| 1 | Fecha | Fecha de generacion | 15 de marzo de 2026 |
| 2 | Destinatario (entidad) | proceso.buyer.name | Consejo Estatal del Azucar |
| 3 | Referencia del proceso | proceso.codigo_proceso | CESAC-DAF-CM-2026-0015 |
| 4 | Objeto del proceso | proceso.titulo | Adquisicion de pintura para centros |
| 5 | Nombre de la empresa | tenant.nombre_legal | KOSMIMA INVESTMENT, S.R.L. |
| 6 | RNC | tenant.rnc | 133-07847-3 |
| 7 | RPE | tenant.rpe | 118338 |
| 8 | Representante legal | tenant.representante_legal | Genauris Ramirez Dipre |
| 9 | Cedula representante | tenant.cedula_representante | 402-1005801-8 |
| 10 | Direccion | tenant.direccion | Av. Los Proceres #38, Local 10C |
| 11 | Telefono | tenant.telefono | 829-759-6507 |
| 12 | Email | tenant.email | kosmimainvestment@gmail.com |
| 13 | Monto de la oferta | escenario.precio_total | RD$ 1,431,788.40 |
| 14 | Monto en letras | convertir(monto) | Un millon cuatrocientos treinta y un mil... |
| 15 | Vigencia de la oferta | 90 dias (estandar) | 90 dias calendario |
| 16 | Firma | tenant.firma_imagen | firma_genauris.jpg |
| 17 | Sello | tenant.sello_imagen | sello_kosmima.jpg |

### Declaraciones incluidas (texto fijo)

```
1. Que hemos examinado el Pliego de Condiciones Especificas y aceptamos
   todas las condiciones establecidas en el mismo.

2. Que nuestra oferta es valida por un periodo de noventa (90) dias
   calendario contados a partir de la fecha de apertura.

3. Que nos comprometemos a ejecutar el contrato conforme a las
   especificaciones del pliego si resultamos adjudicatarios.

4. Que declaramos bajo juramento que la informacion contenida en esta
   oferta es veraz y que no nos encontramos en ninguna de las causales
   de inhabilidad previstas en la Ley 340-06 y sus modificaciones.

5. Que aceptamos la jurisdiccion de los tribunales de la Republica
   Dominicana para la resolucion de cualquier controversia.
```

---

## SNCC.F.033 — Oferta Economica

### Proposito
Formulario oficial para presentar los precios. Es el documento que se evalua en la apertura del Sobre B.

### Campos del encabezado

| # | Campo | Fuente |
|---|-------|--------|
| 1 | Codigo del proceso | proceso.codigo_proceso |
| 2 | Nombre del proceso | proceso.titulo |
| 3 | Entidad compradora | proceso.buyer.name |
| 4 | Nombre del oferente | tenant.nombre_legal |
| 5 | RNC | tenant.rnc |
| 6 | RPE | tenant.rpe |
| 7 | Fecha | Fecha de generacion |

### Tabla de items

| Columna | Descripcion | Fuente |
|---------|-------------|--------|
| Item # | Numero secuencial | Auto |
| Descripcion | Descripcion del item/articulo | proceso.articulos[].descripcion |
| Unidad | Unidad de medida | proceso.articulos[].unidad |
| Cantidad | Cantidad solicitada | proceso.articulos[].cantidad |
| Precio unitario | Precio por unidad (con descuento aplicado internamente) | escenario.precios[].unitario |
| Subtotal | Cantidad × Precio unitario | Calculado |

### Totales

| Campo | Calculo |
|-------|---------|
| Subtotal | SUM(subtotales) |
| ITBIS 18% | subtotal × 0.18 |
| Total con ITBIS | subtotal + ITBIS |
| Monto en letras | convertir(total) |

### Reglas de ITBIS por sector

| Tipo | ITBIS | Base legal |
|------|-------|-----------|
| Servicios de construccion | 18% | Ley 253-12, Art. 345 |
| Servicios de pintura | 18% | Ley 253-12 |
| Servicios de consultoria | 18% | Ley 253-12 |
| Servicios de TI | 18% | Ley 253-12 |
| Software (desarrollo custom) | 18% | Ley 253-12 |
| Licencias de software importadas | Exento | Ley 253-12, Art. 344(12) |
| Equipos de computo importados | Exento | Ley 253-12, Art. 344(14) |
| Hardware fabricado en RD | 18% | Ley 253-12 |
| Bienes de consumo general | 18% | Ley 253-12 |
| Medicamentos | Exento | Ley 253-12, Art. 344(3) |
| Combustibles | Impuesto ad-valorem diferente | Ley 112-00 |

### Validaciones automaticas

```
1. ITBIS correcto: subtotal × 0.18 == itbis_declarado (tolerancia ±RD$1)
2. Total correcto: subtotal + itbis == total_declarado (tolerancia ±RD$1)
3. Precio unitario > 0 para todos los items
4. Cantidad == cantidad del pliego (no puede cambiar)
5. Monto total <= presupuesto referencial (advertencia si excede)
6. Monto en letras == monto en numeros
```

---

## SNCC.F.042 — Informacion del Oferente

### Proposito
Ficha completa de la empresa. Se presenta una vez por proceso.

### Seccion 1: Datos Generales

| Campo | Fuente | Nota |
|-------|--------|------|
| Razon social | tenant.nombre_legal | Exactamente como en Registro Mercantil |
| Nombre comercial | tenant.nombre_comercial | Si aplica |
| RNC | tenant.rnc | |
| Tipo empresa | tenant.tipo | SRL, SAS, EIRL |
| Fecha constitucion | tenant.fecha_constitucion | |
| Capital autorizado | tenant.capital | En RD$ |
| Capital pagado | tenant.capital_pagado | |
| Direccion principal | tenant.direccion | |
| Telefono | tenant.telefono | |
| Email | tenant.email | |
| Sitio web | tenant.web | |

### Seccion 2: Representante Legal

| Campo | Fuente |
|-------|--------|
| Nombre completo | tenant.representante_legal |
| Cedula/Pasaporte | tenant.cedula_representante |
| Nacionalidad | tenant.nacionalidad_representante |
| Cargo | "Gerente General" / segun acta |
| Telefono personal | tenant.tel_representante |
| Email personal | tenant.email_representante |

### Seccion 3: Socios/Accionistas

| Campo | Fuente |
|-------|--------|
| Nombre del socio | tenant.socios[].nombre |
| Cedula | tenant.socios[].cedula |
| Porcentaje acciones | tenant.socios[].porcentaje |
| Nacionalidad | tenant.socios[].nacionalidad |

### Seccion 4: Experiencia General

| Campo | Fuente |
|-------|--------|
| Anos en el mercado | Calculado desde fecha_constitucion |
| Sector principal | tenant.sector |
| Descripcion general | tenant.descripcion_empresa |
| Principales clientes | tenant.clientes_principales |

---

## SNCC.D.049 — Experiencia Especifica

### Proposito
Demostrar experiencia en trabajos similares al proceso. Es el documento mas dificil de automatizar porque requiere datos REALES de proyectos ejecutados.

### Campos por proyecto

| Campo | Fuente | Nota |
|-------|--------|------|
| Nombre del proyecto | tenant.proyectos[].nombre | Nombre oficial del contrato |
| Cliente/Entidad | tenant.proyectos[].cliente | Quien contrato |
| Codigo contrato | tenant.proyectos[].codigo | Referencia oficial |
| Monto del contrato | tenant.proyectos[].monto | En RD$ |
| Fecha inicio | tenant.proyectos[].fecha_inicio | |
| Fecha terminacion | tenant.proyectos[].fecha_fin | |
| Estado | tenant.proyectos[].estado | Completado/En ejecucion |
| Descripcion del alcance | tenant.proyectos[].descripcion | Que se hizo exactamente |
| Contacto referencia | tenant.proyectos[].contacto | Nombre + telefono del cliente |

### Requisitos tipicos por sector

| Sector | Experiencia minima | Monto minimo acumulado |
|--------|-------------------|----------------------|
| Construccion | 3 proyectos similares | 50% del monto del proceso |
| Tecnologia | 2-3 proyectos similares | 30-50% del monto |
| Vigilancia | 2 proyectos similares | 30% del monto |
| Telecom | 2 proyectos similares | 30% del monto |
| Suministros | Facturacion anual demostrable | Variable |

### Estrategia para el SaaS

El tenant carga sus proyectos ejecutados UNA VEZ en su perfil. El sistema:
1. Filtra automaticamente los mas relevantes para cada proceso
2. Ordena por similitud (tipo de trabajo + monto)
3. Genera el D.049 con los mejores 3-5 proyectos
4. Alerta si no tiene suficiente experiencia

---

## SNCCP-PROV-F-040 — Conflicto de Interes

### Proposito
Declaracion de que no existe relacion ni conflicto con la entidad compradora.

### Campos

| Campo | Fuente | Valor |
|-------|--------|-------|
| Fecha | Auto | Fecha de generacion |
| Proceso | proceso.codigo | CESAC-DAF-CM-2026-0015 |
| Empresa | tenant.nombre_legal | |
| RNC | tenant.rnc | |
| Representante | tenant.representante_legal | |
| Declaracion 1 | Texto fijo | No soy funcionario/a ni empleado/a de la entidad |
| Declaracion 2 | Texto fijo | No tengo parentesco hasta 4to grado con directivos |
| Declaracion 3 | Texto fijo | No tengo intereses economicos con la entidad |
| Declaracion 4 | Texto fijo | No he sido inhabilitado por la DGCP |
| Firma | tenant.firma_imagen | |

---

## Compromiso Etico

### Proposito
Declaracion de compromiso con etica y anticorrupcion.

### Texto estandar (completo)

```
COMPROMISO ETICO DEL OFERENTE

Yo, [REPRESENTANTE LEGAL], en mi calidad de representante legal de
[EMPRESA], identificada con RNC [RNC], me comprometo a:

1. No ofrecer, prometer, dar o aceptar sobornos, dadivas, regalos o
   cualquier tipo de gratificacion a funcionarios publicos o a terceros
   con el fin de obtener ventajas en el proceso [CODIGO PROCESO].

2. Cumplir con todas las leyes y regulaciones vigentes en la Republica
   Dominicana relacionadas con la contratacion publica, incluyendo
   la Ley 340-06 y la Ley 47-25.

3. Denunciar ante las autoridades competentes cualquier acto de
   corrupcion del que tenga conocimiento.

4. Aceptar la supervision y control de las autoridades competentes
   durante la ejecucion del contrato.

5. Mantener la confidencialidad de la informacion a la que tenga
   acceso durante el proceso de contratacion.

Firma: ___________________________
Nombre: [REPRESENTANTE LEGAL]
Cedula: [CEDULA]
Empresa: [EMPRESA]
Fecha: [FECHA]
```

---

## Formulario de Debida Diligencia

### Proposito
Verificar el origen de fondos y la legitimidad de la empresa. Obligatorio desde 2025.

### Campos

| Seccion | Campo | Fuente |
|---------|-------|--------|
| Identificacion | Nombre empresa, RNC, direccion | tenant.* |
| Actividad economica | Descripcion del negocio | tenant.sector |
| Origen de fondos | Fuente principal de ingresos | tenant.origen_fondos |
| Beneficiario final | Persona fisica que controla >25% | tenant.socios[] |
| PEP | ¿Es Persona Expuesta Politicamente? | tenant.pep (boolean) |
| Pais de operacion | Republica Dominicana | Fijo |
| Entidades bancarias | Bancos donde opera | tenant.bancos[] |
| Declaracion | No vinculado a lavado de activos | Texto fijo |

---

## Datos Minimos del Tenant para Generar Todo

Para que el SaaS genere TODOS los formularios automaticamente, el tenant necesita tener cargados:

```typescript
interface TenantCompleto {
  // Basicos (obligatorios en onboarding)
  nombre_legal: string
  nombre_comercial?: string
  rnc: string
  rpe: string
  tipo_empresa: 'SRL' | 'SAS' | 'EIRL' | 'SA'
  direccion: string
  telefono: string
  email: string
  sector: string

  // Representante legal
  representante_legal: string
  cedula_representante: string
  nacionalidad_representante: string
  tel_representante?: string
  email_representante?: string

  // Societario
  fecha_constitucion: string
  capital_autorizado?: number
  capital_pagado?: number
  socios: {
    nombre: string
    cedula: string
    porcentaje: number
    nacionalidad: string
  }[]

  // Experiencia
  proyectos: {
    nombre: string
    cliente: string
    codigo?: string
    monto: number
    fecha_inicio: string
    fecha_fin?: string
    estado: 'completado' | 'en_ejecucion'
    descripcion: string
    sector: string  // construccion, tecnologia, etc.
    contacto_referencia?: string
  }[]

  // Documentos subidos (PDFs)
  documentos: {
    dgii_certificacion: { url: string, fecha_vencimiento: string }
    tss_certificacion: { url: string, fecha_vencimiento: string }
    registro_mercantil: { url: string }
    estatutos: { url: string }
    acta_designacion: { url: string }
    cedula_representante_pdf: { url: string }
    mipyme_certificacion?: { url: string, fecha_vencimiento: string }
  }

  // Imagenes
  firma_imagen: string  // URL en Supabase Storage
  sello_imagen: string

  // Financiero
  balance_data?: {
    activo_total: number
    pasivo_total: number
    activo_corriente: number
    pasivo_corriente: number
    inventarios: number
    patrimonio_neto: number
    fecha_estados_financieros: string
  }

  // Clasificacion
  clasificacion_mipyme: 'micro' | 'pequena' | 'mediana' | null
  es_mipyme_mujer: boolean

  // Bancario
  banco_principal: string
  cuenta_bancaria: string
  tipo_cuenta: 'corriente' | 'ahorro'

  // UNSPSC
  codigos_unspsc: string[]

  // Keywords
  keywords: string[]

  // RPE credenciales (encriptadas)
  rpe_usuario?: string
  rpe_password_encrypted?: string
}
```

### Completitud del perfil

El dashboard debe mostrar:
```
PERFIL DE EMPRESA — 78% completo
  ✅ Datos basicos (100%)
  ✅ Representante legal (100%)
  ✅ Socios (100%)
  ⚠️ Experiencia (2 proyectos — recomendado 5+)
  ✅ Certificaciones DGII/TSS (vigentes)
  ⚠️ Balance financiero (no cargado)
  ✅ Firma y sello (subidos)
  ❌ Credenciales RPE (no configurado — sin auto-submit)
```

---

*HEFESTO — "Cada campo tiene su lugar, cada dato su proposito"*
*2026-03-14*
