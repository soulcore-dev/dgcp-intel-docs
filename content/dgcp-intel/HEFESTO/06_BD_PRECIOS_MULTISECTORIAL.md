# Base de Datos de Precios — Multisectorial RD

> Fuente: HEFESTO (construccion) + investigacion de mercado (TI, vigilancia, telecom)
> Fecha: 2026-03-14

---

## Estructura de la BD de Precios para el SaaS

La BD de precios es el diferenciador competitivo de DGCP INTEL. Ningun competidor tiene precios reales del mercado dominicano organizados por sector. Esta BD alimenta:

1. **F2 Inteligencia**: Calcular costo real vs presupuesto referencial
2. **F3 Preparacion**: Generar cotizaciones con precios reales
3. **Scoring**: Evaluar si el margen es viable

---

## Schema Supabase — Multisectorial

```sql
-- Tabla unificada de precios de referencia
CREATE TABLE ref_precios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector TEXT NOT NULL,           -- 'construccion', 'tecnologia', 'vigilancia', 'telecom', 'servicios'
  categoria TEXT NOT NULL,        -- 'materiales', 'mano_obra', 'equipos', 'licencias', 'hardware'
  subcategoria TEXT,              -- 'concreto', 'acero', 'servidores', 'camaras'
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT NOT NULL,           -- 'unidad', 'm²', 'hora', 'galon', 'mes', 'por_camara'
  precio_min NUMERIC NOT NULL,    -- rango bajo del mercado
  precio_max NUMERIC NOT NULL,    -- rango alto del mercado
  precio_referencia NUMERIC NOT NULL,  -- precio recomendado (promedio o mas usado)
  moneda TEXT DEFAULT 'DOP',      -- 'DOP' o 'USD' (hardware/licencias)
  itbis_aplicable BOOLEAN DEFAULT true,
  fuente TEXT,                    -- 'Ferreteria Popular 2025', 'Amazon RD', 'CNS 2022'
  region TEXT DEFAULT 'nacional', -- 'santo_domingo', 'interior', 'nacional'
  vigencia_desde DATE,
  vigencia_hasta DATE,
  rendimiento_descripcion TEXT,   -- '8-10 m²/dia', '50 endpoints/hora'
  rendimiento_valor NUMERIC,
  rendimiento_unidad TEXT,        -- 'm²/dia', 'endpoints/hora'
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ref_precios_sector ON ref_precios(sector);
CREATE INDEX idx_ref_precios_categoria ON ref_precios(sector, categoria);
CREATE INDEX idx_ref_precios_nombre ON ref_precios USING gin(to_tsvector('spanish', nombre));

-- Historial de precios (para tracking de inflacion)
CREATE TABLE ref_precios_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  precio_id UUID NOT NULL REFERENCES ref_precios(id),
  precio_anterior NUMERIC NOT NULL,
  precio_nuevo NUMERIC NOT NULL,
  variacion_pct NUMERIC,
  fecha_cambio DATE NOT NULL,
  motivo TEXT,    -- 'inflacion', 'actualizacion_proveedor', 'nueva_cotizacion'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## SECTOR: CONSTRUCCION (155 items existentes en Hefesto)

### Materiales — Concreto y Agregados

| Nombre | Unidad | Precio RD$ | Fuente |
|--------|--------|-----------|--------|
| Cemento Portland Gris 42.5 kg | saco | 375 | Ferreteria Popular 2025 |
| Arena lavada | m³ | 1,566 | Cantera Santo Domingo |
| Gravilla 3/4" | m³ | 1,962 | Cantera Santo Domingo |
| Grava 1" | m³ | 2,100 | Cantera Santo Domingo |
| Block 6" estandar | unidad | 28.93 | Fabrica local |
| Block 8" estandar | unidad | 42.00 | Fabrica local |
| Hormigon premezclado 210 kg/cm² | m³ | 7,500 | CEMEX/Argos |
| Hormigon premezclado 280 kg/cm² | m³ | 8,200 | CEMEX/Argos |

### Materiales — Acero

| Nombre | Unidad | Precio RD$ | Fuente |
|--------|--------|-----------|--------|
| Varilla 3/8" corrugada (G60) | unidad (20') | 245 | METALDOM |
| Varilla 1/2" corrugada | unidad (20') | 420 | METALDOM |
| Varilla 5/8" corrugada | unidad (20') | 650 | METALDOM |
| Varilla 3/4" corrugada | unidad (20') | 945 | METALDOM |
| Alambre dulce #18 | lb | 42 | Ferreteria |
| Malla electrosoldada 6x6 | hoja | 1,800 | METALDOM |

### Materiales — Pintura

| Nombre | Unidad | Precio RD$ | Fuente |
|--------|--------|-----------|--------|
| Pintura acrilica premium | galon | 1,250 | Popular Pinturas |
| Pintura acrilica economica | galon | 750 | Popular Pinturas |
| Pintura esmalte | galon | 1,450 | Popular Pinturas |
| Pintura epoxica | galon | 3,200 | Sherwin Williams |
| Sellador acrilico | galon | 650 | Popular Pinturas |
| Impermeabilizante | galon | 1,800 | SUR/Sika |
| Thinner | galon | 350 | Ferreteria |

### Mano de Obra (CNS 2022 + 20% ajuste 2025)

| Cargo | Tarifa diaria RD$ | Rendimiento |
|-------|-------------------|-------------|
| Peon/Obrero | 980.59 | General |
| Albanil | 1,471.11 | 8-10 m²/dia pared |
| Maestro/Supervisor | 2,941.78 | Supervision |
| Pintor | 1,933.33 | 20-30 m²/dia (2 manos) |
| Electricista | 2,800.00 | Variable |
| Plomero | 2,500.00 | Variable |
| Carpintero | 1,800.00 | Variable |
| Soldador | 2,200.00 | Variable |
| Operador equipo pesado | 2,500.00 | 8h/dia |
| Chofer camion | 1,800.00 | 8h/dia |

### Equipos

| Nombre | Tarifa por hora RD$ | Tarifa por dia RD$ |
|--------|--------------------|--------------------|
| Retroexcavadora | 2,500 | 18,000 |
| Camion volquete 10m³ | 1,800 | 12,000 |
| Compactadora vibratoria | 800 | 5,500 |
| Mezcladora de concreto (1 saco) | 350 | 2,500 |
| Andamios metalicos | — | 500/cuerpo |
| Generador electrico 5KW | 500 | 3,500 |
| Bomba de agua 3" | 250 | 1,800 |

---

## SECTOR: TECNOLOGIA (datos nuevos para el SaaS)

### Hardware — Computadoras y Servidores

| Nombre | Unidad | Precio min RD$ | Precio max RD$ | Ref RD$ |
|--------|--------|----------------|----------------|---------|
| Laptop empresarial i5/16GB/512SSD | unidad | 45,000 | 65,000 | 52,000 |
| Laptop empresarial i7/32GB/1TB | unidad | 70,000 | 95,000 | 80,000 |
| Desktop empresarial i5/16GB/512SSD | unidad | 32,000 | 48,000 | 38,000 |
| Monitor 24" FHD | unidad | 10,000 | 18,000 | 13,000 |
| Monitor 27" 4K | unidad | 22,000 | 38,000 | 28,000 |
| Servidor rack 2U Xeon/64GB/RAID | unidad | 180,000 | 350,000 | 250,000 |
| Servidor torre Xeon/32GB | unidad | 120,000 | 200,000 | 150,000 |
| NAS 4-bay + 4×4TB | unidad | 45,000 | 80,000 | 60,000 |
| UPS 1500VA line interactive | unidad | 12,000 | 25,000 | 16,000 |
| UPS 3KVA online doble conversion | unidad | 35,000 | 55,000 | 42,000 |
| UPS 10KVA online | unidad | 120,000 | 200,000 | 150,000 |
| Impresora laser monocromatica | unidad | 15,000 | 25,000 | 18,000 |
| Impresora multifuncional color | unidad | 25,000 | 50,000 | 35,000 |

### Software — Licencias

| Nombre | Unidad | Precio USD | Precio RD$ (×60) | ITBIS |
|--------|--------|-----------|------------------|-------|
| Windows 11 Pro | licencia | 199 | 11,940 | Exento (importado) |
| Office 365 Business Basic | usuario/ano | 72 | 4,320 | 18% |
| Office 365 Business Standard | usuario/ano | 150 | 9,000 | 18% |
| Windows Server 2022 Standard | licencia | 1,069 | 64,140 | Exento |
| SQL Server Standard (2-core) | licencia | 3,945 | 236,700 | Exento |
| Antivirus ESET Endpoint (1 ano) | endpoint | 35 | 2,100 | 18% |
| Antivirus Kaspersky Business | endpoint | 40 | 2,400 | 18% |
| Backup Veeam (por VM) | licencia | 500 | 30,000 | Exento |
| VMware vSphere Standard | socket | 4,500 | 270,000 | Exento |
| AutoCAD LT (suscripcion anual) | usuario | 475 | 28,500 | 18% |

### Servicios TI — Tarifas por hora

| Rol | Hora RD$ min | Hora RD$ max | Hora RD$ ref |
|-----|-------------|-------------|-------------|
| Soporte tecnico N1 | 800 | 1,500 | 1,000 |
| Soporte tecnico N2 | 1,500 | 2,500 | 1,800 |
| Administrador de sistemas | 2,000 | 4,000 | 2,800 |
| DBA (administrador BD) | 3,000 | 6,000 | 4,000 |
| Desarrollador junior | 1,200 | 2,000 | 1,500 |
| Desarrollador mid | 2,000 | 3,500 | 2,500 |
| Desarrollador senior | 3,500 | 6,000 | 4,500 |
| Arquitecto de solucion | 5,000 | 10,000 | 7,000 |
| DevOps/Cloud engineer | 3,000 | 6,000 | 4,000 |
| Consultor ciberseguridad | 4,000 | 8,000 | 5,500 |
| Project Manager TI | 3,000 | 6,000 | 4,000 |
| QA/Tester | 1,500 | 3,000 | 2,000 |

---

## SECTOR: SISTEMAS DE VIGILANCIA

### Camaras

| Nombre | Unidad | Precio RD$ min | Precio RD$ max | Ref RD$ |
|--------|--------|----------------|----------------|---------|
| Camara IP domo 2MP interior | unidad | 5,000 | 8,000 | 6,500 |
| Camara IP domo 4MP interior | unidad | 8,500 | 15,000 | 11,000 |
| Camara IP bullet 4MP exterior | unidad | 10,000 | 18,000 | 13,000 |
| Camara IP bullet 8MP exterior | unidad | 15,000 | 35,000 | 22,000 |
| Camara PTZ 2MP 25x zoom | unidad | 25,000 | 55,000 | 38,000 |
| Camara PTZ 4MP 25x zoom | unidad | 45,000 | 120,000 | 70,000 |
| Camara termica | unidad | 80,000 | 250,000 | 150,000 |
| Camara LPR (placas vehiculos) | unidad | 60,000 | 150,000 | 90,000 |
| Camara panoramica 180° | unidad | 35,000 | 80,000 | 55,000 |

### Grabacion y almacenamiento

| Nombre | Unidad | Precio RD$ min | Precio RD$ max | Ref RD$ |
|--------|--------|----------------|----------------|---------|
| NVR 8 canales + 2TB HDD | unidad | 18,000 | 35,000 | 25,000 |
| NVR 16 canales + 4TB HDD | unidad | 35,000 | 65,000 | 48,000 |
| NVR 32 canales + 8TB HDD | unidad | 65,000 | 120,000 | 85,000 |
| NVR 64 canales enterprise | unidad | 120,000 | 250,000 | 170,000 |
| HDD vigilancia 4TB (WD Purple) | unidad | 6,500 | 9,000 | 7,500 |
| HDD vigilancia 8TB (WD Purple) | unidad | 12,000 | 16,000 | 14,000 |
| HDD vigilancia 12TB | unidad | 18,000 | 24,000 | 20,000 |

### Infraestructura CCTV

| Nombre | Unidad | Precio RD$ min | Precio RD$ max | Ref RD$ |
|--------|--------|----------------|----------------|---------|
| Monitor vigilancia 32" FHD | unidad | 15,000 | 25,000 | 18,000 |
| Monitor vigilancia 43" 4K | unidad | 25,000 | 45,000 | 32,000 |
| Monitor vigilancia 55" 4K | unidad | 35,000 | 55,000 | 42,000 |
| Video Wall controller 4 salidas | unidad | 45,000 | 120,000 | 70,000 |
| Switch PoE 8 puertos | unidad | 5,000 | 12,000 | 8,000 |
| Switch PoE 16 puertos | unidad | 15,000 | 35,000 | 22,000 |
| Switch PoE 24 puertos | unidad | 25,000 | 55,000 | 38,000 |
| Rack 12U pared | unidad | 5,000 | 12,000 | 8,000 |
| Rack 20U piso | unidad | 12,000 | 22,000 | 16,000 |
| Rack 42U piso | unidad | 25,000 | 45,000 | 32,000 |

### Mano de obra CCTV

| Rol | Tarifa diaria RD$ | Rendimiento |
|-----|-------------------|-------------|
| Tecnico CCTV | 2,500 | 4-6 camaras/dia (instalacion) |
| Tecnico cableado | 1,800 | 200m cable/dia |
| Ingeniero de proyecto | 4,000 | Diseno + supervision |
| Programador VMS | 3,500 | Configuracion software |

---

## SECTOR: TELECOMUNICACIONES

### Cableado estructurado

| Nombre | Unidad | Precio RD$ min | Precio RD$ max | Ref RD$ |
|--------|--------|----------------|----------------|---------|
| Cable UTP Cat5e | caja 305m | 2,500 | 4,500 | 3,200 |
| Cable UTP Cat6 | caja 305m | 4,500 | 8,000 | 5,800 |
| Cable UTP Cat6A blindado | caja 305m | 8,000 | 14,000 | 10,000 |
| Fibra optica monomodo 6 hilos | metro | 18 | 35 | 25 |
| Fibra optica monomodo 12 hilos | metro | 25 | 45 | 32 |
| Fibra optica multimodo 6 hilos | metro | 15 | 28 | 20 |
| Patch panel 24p Cat6 | unidad | 3,500 | 6,000 | 4,500 |
| Patch panel 48p Cat6 | unidad | 6,000 | 10,000 | 7,500 |
| Jack RJ45 Cat6 | unidad | 250 | 600 | 350 |
| Patch cord Cat6 3ft | unidad | 150 | 350 | 220 |
| Patch cord Cat6 7ft | unidad | 200 | 450 | 300 |
| Faceplate 2 puertos | unidad | 80 | 200 | 120 |
| Canaleta 40x25 con tapa | metro | 85 | 180 | 120 |
| Canaleta 60x40 con tapa | metro | 150 | 300 | 200 |

### Equipos de red

| Nombre | Unidad | Precio RD$ min | Precio RD$ max | Ref RD$ |
|--------|--------|----------------|----------------|---------|
| Switch L2 24p 1G | unidad | 15,000 | 35,000 | 22,000 |
| Switch L2 48p 1G PoE | unidad | 45,000 | 90,000 | 60,000 |
| Switch L3 24p 10G | unidad | 80,000 | 200,000 | 120,000 |
| Router empresarial | unidad | 25,000 | 150,000 | 65,000 |
| Firewall UTM (50 usuarios) | unidad | 35,000 | 80,000 | 55,000 |
| Firewall UTM (200 usuarios) | unidad | 80,000 | 250,000 | 150,000 |
| Access Point WiFi 6 indoor | unidad | 8,000 | 25,000 | 14,000 |
| Access Point WiFi 6 outdoor | unidad | 15,000 | 45,000 | 28,000 |
| Controladora WiFi (50 APs) | unidad | 45,000 | 120,000 | 70,000 |

### Certificacion y pruebas

| Servicio | Unidad | Precio RD$ |
|----------|--------|-----------|
| Certificacion punto Cat6 (Fluke) | punto | 350-600 |
| Certificacion punto Cat6A | punto | 500-800 |
| Prueba OTDR fibra optica | enlace | 2,000-4,000 |
| Fusion de fibra optica | empalme | 1,500-3,000 |
| Etiquetado profesional | punto | 50-100 |

---

## Actualizacion de Precios

### Frecuencia recomendada

| Sector | Frecuencia | Motivo |
|--------|-----------|--------|
| Construccion | Cada 6 meses | Inflacion de materiales |
| Tecnologia - Hardware | Cada 3 meses | Precios bajan, nuevos modelos |
| Tecnologia - Licencias | Cada 12 meses | Renewal anual |
| Vigilancia | Cada 6 meses | Nuevos modelos de camaras |
| Telecom | Cada 6 meses | Relativamente estable |
| Mano de obra | Cada 12 meses | Ajuste CNS + inflacion |

### Fuentes de actualizacion

| Fuente | Sector | Metodo |
|--------|--------|--------|
| Ferreterias (Popular, La Sirena, EPA) | Construccion | Cotizacion directa |
| Amazon RD / Computer City | Hardware TI | Web scraping de precios |
| Distribuidores (Hikvision, Dahua, Axis) | Vigilancia | Lista de precios distribuidor |
| Distribuidores (Cisco, Ubiquiti, TP-Link) | Telecom | Lista de precios distribuidor |
| CNS (Consejo Nacional de Salarios) | Mano de obra | Publicacion oficial |
| DGII / Banco Central | Tasa de cambio | API publica |

---

## Calculo de ITBIS por Sector — Resumen

| Tipo de bien/servicio | ITBIS | Nota |
|----------------------|-------|------|
| Servicios de construccion | 18% | Siempre |
| Servicios de TI/consultoria | 18% | Siempre |
| Hardware importado (computadoras, servidores) | Exento | Ley 253-12 Art. 344(14) |
| Software importado (licencias) | Exento | Ley 253-12 Art. 344(12) |
| Desarrollo de software (servicio local) | 18% | Es un servicio |
| Equipos de vigilancia importados | Exento | Si es importacion directa |
| Equipos de vigilancia comprados localmente | 18% | Si proveedor local cobra ITBIS |
| Cable, conectores, accesorios | 18% | Material local |
| Mano de obra instalacion | 18% | Es un servicio |

**REGLA PARA EL SaaS**: Siempre calcular con ITBIS 18% y marcar como exento solo si el usuario lo confirma. Mejor cobrar de mas que de menos.

---

*HEFESTO — "Cada precio tiene su fuente, cada fuente su fecha"*
*2026-03-14*
