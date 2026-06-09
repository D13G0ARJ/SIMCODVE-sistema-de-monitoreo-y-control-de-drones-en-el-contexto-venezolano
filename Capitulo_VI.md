# CAPÍTULO VI

# DESARROLLO INFORMÁTICO DEL PROTOTIPO

El presente capítulo expone el desarrollo informático de la propuesta formulada en
los capítulos anteriores, es decir, la concreción técnica del **diseño conceptual y
metodológico de un sistema de monitoreo y control de drones en el contexto
venezolano**. Mientras que el Capítulo IV presentó el diagnóstico que sustentó la
pertinencia, necesidad y viabilidad de la propuesta, y el Capítulo V estableció las
conclusiones y recomendaciones derivadas de dicho diagnóstico, este capítulo documenta
la materialización de la solución en un **prototipo funcional de software** denominado
**SIMCODVE** (Sistema de Monitoreo y Control de Drones — Contexto Venezolano).

En coherencia con el alcance y las limitaciones establecidos en el Capítulo I, el
prototipo constituye una **herramienta académica de simulación**. En consecuencia, no
se conecta con drones físicos, hardware aeronáutico, autopilotos, estaciones de control
militares, frecuencias radioeléctricas reales ni información táctica clasificada. La
totalidad de la información manejada es de carácter **sintético**, esto es, generada por
el propio sistema, y la cartografía empleada proviene de servicios de mapas de acceso
abierto.

La estructura del capítulo responde directamente a los tres objetivos específicos de la
investigación, según se evidencia en el Cuadro 6.1, lo que permite verificar la
coherencia entre lo propuesto y lo desarrollado.

**Cuadro 6.1**
*Relación entre los objetivos específicos y las secciones del Capítulo VI*

| Objetivo específico | Sección(es) del Capítulo VI que lo atiende(n) |
|---------------------|-----------------------------------------------|
| Analizar los requerimientos operacionales para determinar las especificaciones críticas del sistema. | 6.4 Especificación de requerimientos y 6.5 Casos de uso y trazabilidad. |
| Desarrollar una arquitectura de software orientada a servicios (SOA) y basada en gemelos digitales. | 6.6 Arquitectura del sistema, 6.7 Diseño estructural (clases) y 6.8 Comportamiento dinámico. |
| Formular un modelo de control descentralizado y algoritmos de consenso. | 6.9 Modelo de control descentralizado y algoritmos de consenso. |

---

## 6.1 Metodología de desarrollo del prototipo

Para el desarrollo del prototipo se adoptó una **metodología de desarrollo de software
iterativa e incremental, basada en el modelo de prototipado evolutivo**, coherente con
la modalidad de **proyecto factible** y con el enfoque **tecnológico-proyectivo**
declarados en el Capítulo III. El prototipado evolutivo resulta adecuado porque el
dominio (monitoreo y control descentralizado de enjambres) presenta comportamientos
emergentes cuya validación requiere observación directa del software en ejecución;
porque permite incorporar de manera incremental los requerimientos identificados en el
diagnóstico del Capítulo IV; y porque favorece la **arquitectura modular** valorada por
los informantes. El proceso se organizó en las fases descritas en el Cuadro 6.2,
ejecutadas de forma cíclica.

**Cuadro 6.2**
*Fases de la metodología de desarrollo*

| Fase | Descripción |
|------|-------------|
| 1. Análisis | Derivación de los requerimientos a partir del diagnóstico (Cap. IV), los objetivos específicos y las bases teóricas (Cap. II). |
| 2. Diseño | Definición de la arquitectura orientada a servicios, el modelo de datos (gemelos digitales) y el modelo de control descentralizado. |
| 3. Construcción incremental | Implementación del incremento funcional de la iteración (motor de simulación, servicios e interfaz). |
| 4. Pruebas | Verificación funcional del incremento mediante corridas reproducibles y observación del comportamiento. |
| 5. Evaluación y refinamiento | Valoración del incremento y ajuste de los requerimientos para la siguiente iteración. |

---

## 6.2 Descripción general del prototipo SIMCODVE

SIMCODVE es un **prototipo local de simulación** orientado al monitoreo y control
académico de unidades tipo dron. El sistema permite cargar escenarios, desplegar
enjambres simulados, representar las unidades sobre un mapa y una vista radar, generar
telemetría sintética, simular la pérdida de comunicación, registrar métricas y exportar
resultados. Su finalidad es **demostrar la viabilidad técnica del diseño conceptual
propuesto**, sin conexión con hardware real ni uso de datos operativos. El Cuadro 6.3
resume sus características generales.

**Cuadro 6.3**
*Descripción general del prototipo*

| Elemento | Descripción |
|----------|-------------|
| Nombre | SIMCODVE |
| Tipo | Prototipo local de simulación con interfaz web |
| Finalidad | Simular el monitoreo y control de unidades tipo dron |
| Usuario | Operador académico |
| Datos | Sintéticos |
| Ejecución | Servidor local + navegador web |
| Alcance | Académico y demostrativo |
| Exclusiones | Sin drones reales, sin hardware, sin frecuencias radioeléctricas reales |

---

## 6.3 Alcance técnico del prototipo

A fin de delimitar con precisión el desarrollo y reafirmar su carácter académico y
seguro, el Cuadro 6.4 contrasta lo que el prototipo **incluye** frente a lo que
**excluye** de manera explícita.

**Cuadro 6.4**
*Alcance técnico del prototipo*

| Incluye | No incluye |
|---------|------------|
| Simulación de drones | Drones físicos |
| Telemetría sintética | Sensores reales |
| Mapa referencial de acceso abierto | Cartografía táctica clasificada |
| Comunicación local (WebSocket) | Comunicación radio real |
| Fallos simulados | Interferencia física real |
| Exportación a CSV | Base de datos operacional |

---

## 6.4 Especificación de requerimientos

A partir del diagnóstico del Capítulo IV y de los objetivos específicos, se
determinaron los requerimientos del sistema, clasificados en funcionales y no
funcionales.

### 6.4.1 Requerimientos funcionales

**Cuadro 6.5**
*Requerimientos funcionales del prototipo*

| Código | Requerimiento funcional |
|--------|--------------------------|
| RF-01 | Iniciar la simulación de unidades tipo dron. |
| RF-02 | Pausar y reanudar la simulación. |
| RF-03 | Reiniciar el escenario simulado. |
| RF-04 | Representar múltiples unidades tipo dron en una interfaz tipo radar. |
| RF-05 | Generar datos sintéticos de posición, velocidad, altitud, batería y estado. |
| RF-06 | Mostrar la trayectoria de las unidades simuladas. |
| RF-07 | Seleccionar una unidad simulada para consultar su información. |
| RF-08 | Generar alertas por batería baja, pérdida de comunicación o falla simulada. |
| RF-09 | Representar eventos de pérdida de comunicación. |
| RF-10 | Registrar eventos y métricas de la simulación. |
| RF-11 | Exportar métricas o resultados en un formato reutilizable. |
| RF-12 | Funcionar sin conexión con drones físicos ni hardware externo. |

### 6.4.2 Requerimientos no funcionales

**Cuadro 6.6**
*Requerimientos no funcionales del prototipo*

| Código | Requerimiento no funcional |
|--------|-----------------------------|
| RNF-01 | **Tiempo real.** La telemetría debe transmitirse de forma continua mediante un canal persistente, con una frecuencia de actualización del orden de 10 Hz. |
| RNF-02 | **Modularidad (SOA).** El sistema debe organizarse como servicios independientes y desacoplados. |
| RNF-03 | **Soberanía tecnológica.** El sistema debe construirse con herramientas de software libre y de código abierto, auditable. |
| RNF-04 | **Datos sintéticos.** El sistema no debe utilizar drones físicos, sensores, frecuencias reales ni información clasificada. |
| RNF-05 | **Reproducibilidad.** Los escenarios deben replicar el mismo comportamiento en cada ejecución (corridas deterministas mediante semilla). |
| RNF-06 | **Usabilidad y conciencia situacional.** La interfaz debe priorizar claridad visual, símbolos comprensibles, leyenda y alertas oportunas. |
| RNF-07 | **Portabilidad.** El sistema debe ejecutarse en equipos de escritorio convencionales mediante un navegador web moderno. |
| RNF-08 | **Escalabilidad conceptual.** La arquitectura debe permitir la incorporación de nuevos módulos, escenarios y métricas. |

---

## 6.5 Casos de uso y trazabilidad con los requerimientos

Los requerimientos funcionales se concretan en un conjunto de **casos de uso** que
describen las interacciones del actor **Operador académico** con el sistema. El
prototipo contempla, además, un actor de sistema —el Servicio de Mapas— del cual se
obtiene la cartografía de fondo y la geocodificación. El **diagrama general de casos de
uso** se presenta en la Figura 6.1; este único diagrama agrupa las funciones del sistema
y evita la dispersión que supondría un diagrama por requerimiento.

> **Figura 6.1.** *Diagrama general de casos de uso.* (Archivo: `6.10.1_casos_uso.png`.)

La correspondencia entre casos de uso y requerimientos funcionales se establece en el
Cuadro 6.7; de modo inverso, el Cuadro 6.8 muestra los requerimientos que cubre cada
caso de uso. Esta doble matriz documenta la **trazabilidad** entre lo solicitado y lo
diseñado.

**Cuadro 6.7**
*Trazabilidad: caso de uso → requerimientos funcionales cubiertos*

| Caso de uso | Requerimientos cubiertos |
|-------------|--------------------------|
| CU-01 Configurar escenario de simulación | RF-03, RF-04, RF-05 |
| CU-02 Iniciar simulación | RF-01, RF-04, RF-05, RF-06 |
| CU-03 Pausar / Reanudar simulación | RF-02 |
| CU-04 Reiniciar simulación | RF-03 |
| CU-05 Visualizar radar | RF-04, RF-06 |
| CU-06 Consultar telemetría de unidad | RF-05, RF-07 |
| CU-07 Gestionar alertas simuladas | RF-08, RF-09 |
| CU-08 Registrar métricas y eventos | RF-10 |
| CU-09 Exportar resultados | RF-11 |
| CU-10 Garantizar simulación aislada sin hardware real | RF-12 |

**Cuadro 6.8**
*Trazabilidad: requerimiento funcional → caso(s) de uso que lo realiza(n)*

| Requerimiento funcional | Caso(s) de uso |
|--------------------------|----------------|
| RF-01 Iniciar simulación | CU-02 |
| RF-02 Pausar / reanudar | CU-03 |
| RF-03 Reiniciar | CU-01, CU-04 |
| RF-04 Representar unidades en radar | CU-01, CU-02, CU-05 |
| RF-05 Generar datos sintéticos | CU-01, CU-02, CU-06 |
| RF-06 Mostrar trayectoria | CU-02, CU-05 |
| RF-07 Seleccionar unidad | CU-06 |
| RF-08 Generar alertas | CU-07 |
| RF-09 Pérdida de comunicación | CU-07 |
| RF-10 Registrar métricas y eventos | CU-08 |
| RF-11 Exportar resultados | CU-09 |
| RF-12 Operar sin hardware real | CU-10 |

---

## 6.6 Arquitectura del sistema

### 6.6.1 Visión general

El prototipo adopta una **arquitectura orientada a servicios (SOA)** sobre un modelo
**cliente-servidor**, descompuesto en módulos con responsabilidades diferenciadas. El
sistema se divide en un **servidor** —que aloja el motor de simulación, el módulo de
dominio, los servicios de comportamiento (control descentralizado, consenso, modos y
evasión), el módulo de configuración y el módulo de entrada/salida— y una **interfaz
gráfica** (cliente web) que constituye una vista delgada.

La comunicación se realiza por dos canales complementarios: **REST** (sobre HTTP) para
las órdenes puntuales del operador, y un único **WebSocket** para el flujo continuo de
telemetría. El estado de la simulación reside exclusivamente en el servidor, en una
única instancia en memoria del motor; una tarea en segundo plano avanza la simulación en
pasos de tiempo fijos (de 0,1 s, equivalentes a ~10 Hz) y, tras cada paso, difunde una
representación serializada del estado (*snapshot*) a los clientes. Este principio
garantiza una única fuente de verdad, coherente con el enfoque de **gemelos digitales**.
La organización modular se ilustra en la Figura 6.2.

> **Figura 6.2.** *Diagrama de componentes (arquitectura modular / SOA).* (Archivo: `6.10.6_componentes.png`.)

### 6.6.2 Despliegue

El prototipo se ejecuta íntegramente en la **computadora local** del usuario. El
navegador web actúa como cliente y se comunica con un servidor local; la exportación de
resultados se materializa en **archivos CSV locales**. Los únicos servicios externos son
los de cartografía de acceso abierto. No existe conexión alguna con drones físicos,
hardware aeronáutico, sensores ni frecuencias reales. El diagrama de despliegue se
presenta en la Figura 6.3.

> **Figura 6.3.** *Diagrama de despliegue.* (Archivo: `6.10.8_despliegue.png`.)

### 6.6.3 Pila tecnológica

La selección tecnológica se rige por el requerimiento de **soberanía tecnológica**
(RNF-03): herramientas de software libre, estándares abiertos y servicios cartográficos
de acceso abierto.

**Cuadro 6.9**
*Pila tecnológica del prototipo*

| Capa | Tecnología | Versión |
|------|------------|---------|
| Lenguaje del servidor | Python | 3.14.0 |
| Framework de servicios | FastAPI | 0.136.3 |
| Servidor de aplicaciones | Uvicorn (ASGI) | 0.49.0 |
| Validación de datos | Pydantic | 2.13.4 |
| Comunicación en tiempo real | WebSocket | — |
| Biblioteca de interfaz | React | 19.2.6 |
| Empaquetador y servidor de desarrollo | Vite | 8.0.12 |
| Biblioteca cartográfica | Leaflet | 1.9.4 |
| Teselas satelitales | Esri World Imagery | — |
| Teselas de calles | OpenStreetMap / CartoDB | — |
| Geocodificación | Nominatim (OpenStreetMap) | — |

---

## 6.7 Diseño estructural: diagrama de clases

El núcleo del modelo de datos representa cada unidad como un **gemelo digital**: un
objeto que encapsula los atributos, el estado y la telemetría sintética de una unidad
tipo dron. El diseño estructural se representa mediante el diagrama de clases de la
Figura 6.4, cuyas entidades principales son: **ConfiguracionSistema** (parámetros
globales), **Escenario** (especificación declarativa y reproducible), **MotorSimulacion**
(componente central que avanza la simulación y produce el *snapshot*), **Enjambre**
(conjunto coordinado de unidades), **DronSimulado** (gemelo digital de la unidad),
**Telemetria** (datos sintéticos: posición, altitud, velocidad, batería y señal),
**Waypoint** y **Trayectoria** (recorrido de la unidad), **Alerta** y **GestorAlertas**
(eventos de aviso), **GestorMetricas** (serie temporal y exportación) y **RadarView**
(vista que representa las unidades a partir del *snapshot*).

> **Figura 6.4.** *Diagrama de clases del sistema.* (Archivo: `6.10.5_clases.png`.)

---

## 6.8 Comportamiento dinámico

### 6.8.1 Ciclo general de la simulación (diagrama de actividad)

La Figura 6.5 describe el flujo completo del sistema: la carga de la configuración, la
generación del escenario, la creación de las unidades simuladas, el inicio de la
simulación y el ciclo iterativo de actualización de posiciones, generación de telemetría,
verificación de alertas, actualización de la vista y registro de métricas, hasta la
finalización o exportación de los resultados.

> **Figura 6.5.** *Diagrama de actividad — ciclo general de la simulación.* (Archivo: `6.10.2_actividad_ciclo.png`.)

### 6.8.2 Iniciar simulación (diagrama de secuencia)

La Figura 6.6 representa la interacción entre los objetos al iniciar la simulación: el
operador acciona la interfaz, el motor crea y activa las unidades, y en cada paso se
actualizan las unidades, se produce la telemetría sintética, se actualiza la vista radar
y se registran las métricas.

> **Figura 6.6.** *Diagrama de secuencia — iniciar simulación.* (Archivo: `6.10.3_secuencia_iniciar.png`.)

### 6.8.3 Pérdida de comunicación simulada (diagrama de secuencia)

La Figura 6.7 documenta el flujo asociado a un evento de **pérdida de comunicación**,
vinculado con la resiliencia y el control descentralizado (tercer objetivo específico):
el motor detecta la desconexión, cambia el estado de la unidad afectada, genera la alerta,
actualiza el radar, registra la métrica y reorganiza el enjambre para mantener la
continuidad operativa.

> **Figura 6.7.** *Diagrama de secuencia — pérdida de comunicación simulada.* (Archivo: `6.10.4_secuencia_perdida_comunicacion.png`.)

### 6.8.4 Estados de una unidad simulada (diagrama de estados)

La Figura 6.8 representa los estados por los que transita una unidad: inactiva, activa,
en ruta, en alerta, batería baja, comunicación perdida y finalizada, con sus transiciones.

> **Figura 6.8.** *Diagrama de estados de una unidad simulada.* (Archivo: `6.10.7_estados_unidad.png`.)

---

## 6.9 Modelo de control descentralizado y algoritmos de consenso

Esta sección documenta el componente que da respuesta al tercer objetivo específico: la
formulación de un **modelo de control descentralizado y algoritmos de consenso** que
garanticen la autonomía y la resiliencia del enjambre.

El movimiento del enjambre se basa en el modelo de **comportamientos de dirección
(*steering behaviors*) de Reynolds**, en el cual cada unidad decide su trayectoria de
forma **local y descentralizada**, a partir de la información de sus vecinos, sin depender
de un nodo central. Cada comportamiento produce una **fuerza de dirección** definida como
la diferencia entre una velocidad deseada y la velocidad actual, limitada a una fuerza
máxima; la suma ponderada de estas fuerzas determina la aceleración de la unidad.

Cada unidad combina los siguientes comportamientos: **separación** (evita la colisión);
**alineación**, que materializa el **algoritmo de consenso** promedio, pues cada unidad
ajusta su rumbo hacia el promedio del de sus vecinos del mismo enjambre, convergiendo a
un rumbo común sin coordinador central; **cohesión**, que mantiene la unidad del grupo;
**objetivo del modo**, que dirige la unidad al punto que le corresponde según su modo,
con frenado suave de llegada; y **evasión de interferencia**, que aleja la unidad de las
zonas afectadas.

El modo operativo genera patrones diferenciados: en **patrullaje**, las unidades se
distribuyen en radios escalonados y el conjunto rota, barriendo toda la zona; en
**defensa**, forman un anillo perimetral orientado hacia afuera; y en **híbrido**,
combinan ambos. La comunicación se modela como una **red mesh global** (dos unidades se
enlazan si la distancia es inferior al rango de comunicación). Sobre esta base, la
**inyección de fallos** —eliminación de un nodo y zona de interferencia electromagnética—
permite evaluar la resiliencia, cuantificada mediante el **porcentaje operativo**.

---

## 6.10 Servicios e interfaz de programación

El servidor expone sus operaciones mediante servicios REST y un canal WebSocket. El
Cuadro 6.10 resume los principales puntos de acceso, cada uno de los cuales constituye
una envoltura delgada sobre una operación del motor, preservando el desacoplamiento entre
la capa de servicios y la lógica de dominio (RNF-02).

**Cuadro 6.10**
*Principales servicios del prototipo*

| Método y ruta | Función | Caso de uso |
|---------------|---------|-------------|
| `WS /ws/telemetria` | Flujo de telemetría en tiempo real | CU-02, CU-06 |
| `POST /api/escenarios/{id}/cargar` | Cargar escenario reproducible | CU-01 |
| `POST /api/enjambres` | Iniciar / desplegar unidades | CU-02 |
| `POST /api/config/pausa` | Pausar / reanudar | CU-03 |
| `POST /api/reset` | Reiniciar la simulación | CU-04 |
| `POST /api/config/velocidad` | Ajustar el factor de velocidad | CU-02 |
| `POST /api/fallos/nodo/{id}` | Inyectar pérdida de unidad | CU-07 |
| `POST /api/fallos/jammer` | Inyectar zona de interferencia | CU-07 |
| `GET /api/estado` | Consultar el estado / telemetría | CU-06 |
| `GET /api/export/historial.csv` | Exportar métricas (CSV) | CU-09 |
| `GET /api/export/interferencia.csv` | Exportar reporte de interferencia (CSV) | CU-09 |

---

## 6.11 Diseño de la interfaz de usuario

La interfaz se diseñó priorizando la **conciencia situacional** (RNF-06). Se organiza en
una pantalla de trabajo única compuesta por una barra superior, un panel izquierdo de
control, una vista central y un panel derecho de datos y eventos. La vista central admite
dos representaciones intercambiables: la **Vista Mapa** (mapa satelital real de Venezuela,
con conmutación a vista de calles, sobre el cual se representan las unidades, los enlaces
de la red, la base, las zonas asignadas y las zonas de interferencia) y la **Vista Radar**
(representación tipo radar centrada en la base, con anillos de alcance, barrido giratorio
y las unidades proyectadas sobre el mapa real de calles; materializa la interfaz tipo
radar prevista en los antecedentes, Martínez Pastor, 2021). La interfaz incorpora, además,
un buscador de lugares con geocodificación, una leyenda de símbolos, el control de la
simulación, un panel de estadísticas por unidad, un panel de eventos y alertas, y un
módulo de escenarios preconfigurados.

### 6.11.1 Capturas del prototipo en ejecución

A continuación se presentan las capturas del prototipo en funcionamiento, como evidencia
de su existencia y operación. *(Insertar la imagen correspondiente en cada figura.)*

> **Figura 6.9.** *Vista general del mapa con un enjambre desplegado.* (Captura del sistema en ejecución; insertar imagen.)

> **Figura 6.10.** *Vista radar.* (Captura del sistema en ejecución; insertar imagen.)

> **Figura 6.11.** *Panel de telemetría de una unidad.* (Captura del sistema en ejecución; insertar imagen.)

> **Figura 6.12.** *Inyección de interferencia y pérdida de comunicación.* (Captura del sistema en ejecución; insertar imagen.)

> **Figura 6.13.** *Panel de eventos y alertas.* (Captura del sistema en ejecución; insertar imagen.)

> **Figura 6.14.** *Exportación de métricas.* (Captura del sistema en ejecución; insertar imagen.)

---

## 6.12 Escenarios preconfigurados y reproducibilidad

El sistema incorpora **escenarios preconfigurados**, definidos de forma declarativa y
cargados de manera **reproducible** mediante una semilla (RNF-05). El Cuadro 6.11 los
describe; emplean coordenadas reales de instituciones del territorio venezolano,
obtenidas de cartografía de acceso abierto. La reproducibilidad garantiza que un mismo
escenario genere el mismo comportamiento en cada ejecución, condición necesaria para que
los resultados sean verificables.

**Cuadro 6.11**
*Escenarios preconfigurados*

| Escenario | Descripción |
|-----------|-------------|
| Patrullaje urbano — Los Teques | Un enjambre patrulla en barrido el casco urbano de Los Teques. |
| Defensa de instalación — UNEFA | Un enjambre forma un perímetro defensivo sobre el campus de la UNEFA. |
| Operación multienjambre | Tres enjambres supervisan simultáneamente la UNEFA Los Teques, el Hospital Victorino Santaella y el Fuerte Tiuna. |

---

## 6.13 Monitoreo, métricas y exportación de datos

El sistema calcula, en cada *snapshot*, métricas del estado operativo: número total de
unidades, unidades activas, operativas, degradadas y perdidas, porcentaje operativo y
número de enjambres. Adicionalmente, registra una **serie temporal (historial)** de
estas métricas, muestreada cada cinco segundos de tiempo de simulación, y un registro de
**eventos**. El historial y el reporte de interferencia pueden **exportarse en formato
CSV**, lo que dota a la propuesta de un soporte cuantitativo para el análisis de
resultados.

---

## 6.14 Pruebas funcionales y validación de requerimientos

La verificación del prototipo se realizó mediante **pruebas funcionales** consistentes en
la ejecución del motor con corridas reproducibles y la observación del comportamiento
resultante, contrastándolo con el resultado esperado. El Cuadro 6.12 resume los casos de
prueba más representativos.

**Cuadro 6.12**
*Casos de prueba funcional*

| N.º | Caso de prueba | Resultado esperado | Resultado obtenido |
|-----|----------------|--------------------|--------------------|
| P-01 | Inicio de la simulación y despliegue | Las unidades se crean y parten de la base | Conforme |
| P-02 | Generación de datos sintéticos | Cada unidad produce posición, velocidad, altitud, batería y estado | Conforme |
| P-03 | Representación en radar | Las unidades se proyectan sobre el mapa real, centradas en la base | Conforme |
| P-04 | Pausar / reanudar | La simulación se detiene y reanuda correctamente | Conforme |
| P-05 | Reiniciar | El escenario vuelve a su estado inicial | Conforme |
| P-06 | Distribución en patrullaje | Reparto angular uniforme y estable en el tiempo | Conforme |
| P-07 | Pérdida de comunicación (interferencia) | Las unidades se marcan como degradadas y evitan la zona, manteniendo conectividad | Conforme |
| P-08 | Eliminación de nodo | El enjambre se reorganiza y mantiene la misión | Conforme |
| P-09 | Alertas | Se generan alertas de batería baja, recarga y falla | Conforme |
| P-10 | Ciclo de autonomía energética | Batería baja → retorno a base → recarga → retoma misión | Conforme |
| P-11 | Registro y exportación de métricas | Generación de un archivo CSV con la serie temporal | Conforme |
| P-12 | Operación sin hardware | Funcionamiento íntegro con datos sintéticos, sin dispositivos externos | Conforme |

A partir de los casos de prueba, el Cuadro 6.13 presenta la **validación de los
requerimientos funcionales**, vinculando cada requerimiento con su evidencia de
cumplimiento y su estado. Este cuadro cierra la verificación al demostrar que la totalidad
de los requerimientos funcionales fue satisfecha.

**Cuadro 6.13**
*Validación de los requerimientos funcionales*

| Requerimiento | Evidencia de cumplimiento | Estado |
|---------------|----------------------------|--------|
| RF-01 Iniciar simulación | P-01 | Cumplido |
| RF-02 Pausar / reanudar | P-04 | Cumplido |
| RF-03 Reiniciar | P-05 | Cumplido |
| RF-04 Representar unidades en radar | P-03 | Cumplido |
| RF-05 Generar datos sintéticos | P-02 | Cumplido |
| RF-06 Mostrar trayectoria | P-03 (representación del recorrido en tiempo real) | Cumplido |
| RF-07 Seleccionar unidad | Consulta de telemetría por unidad (panel de estadísticas) | Cumplido |
| RF-08 Generar alertas | P-09 | Cumplido |
| RF-09 Pérdida de comunicación | P-07 | Cumplido |
| RF-10 Registrar métricas y eventos | P-11 | Cumplido |
| RF-11 Exportar resultados | P-11 | Cumplido |
| RF-12 Operar sin hardware real | P-12 | Cumplido |

---

## 6.15 Limitaciones técnicas

En coherencia con el alcance declarado, el prototipo presenta las siguientes limitaciones
técnicas: no se integra con drones físicos, hardware aeronáutico, autopilotos ni sensores
reales (la telemetría es íntegramente sintética, RF-12); no emplea frecuencias
radioeléctricas reales (la comunicación y la interferencia se modelan de forma lógica); el
modelo geográfico utiliza una aproximación plana local, adecuada a la escala de operación
pero no destinada a cálculos geodésicos de precisión; el estado de la simulación reside en
memoria, sin persistencia en base de datos (el historial se conserva durante la sesión y
se exporta bajo demanda); la visualización de la trayectoria (RF-06) se representa en
tiempo real, mientras que su persistencia prolongada (estela) se considera entre las
mejoras futuras; y la cartografía de fondo y la geocodificación requieren conexión a
Internet. Estas limitaciones no comprometen los objetivos de la investigación, en tanto
que el propósito es el diseño conceptual y la simulación académica.

---

## 6.16 Mejoras futuras

El carácter modular del prototipo habilita su evolución. Entre las mejoras futuras se
identifican: la persistencia del historial y de los eventos en una base de datos; la
autenticación de usuarios y la gestión de roles; la incorporación de métricas avanzadas
de resiliencia y de algoritmos de consenso de mayor complejidad; la visualización
persistente de trayectorias y de mapas de cobertura; y la ampliación del catálogo de
escenarios y de modos operativos.

---

## 6.17 Síntesis del capítulo

Este capítulo documentó el desarrollo informático del prototipo SIMCODVE. Se presentó su
descripción general y su alcance técnico; se justificó una metodología iterativa e
incremental basada en prototipado evolutivo; se especificaron doce requerimientos
funcionales y ocho no funcionales; se definieron los casos de uso y su trazabilidad con
los requerimientos; y se documentó el sistema mediante diagramas UML de casos de uso,
componentes, despliegue, clases, actividad, secuencia y estados. Asimismo, se describió el
modelo de control descentralizado y los algoritmos de consenso, los servicios y la
interfaz del sistema, los escenarios reproducibles, el monitoreo con métricas y
exportación de datos, y las pruebas funcionales con la validación de los requerimientos,
que verifican el cumplimiento de la propuesta. La relación establecida en el Cuadro 6.1
evidencia que el capítulo atiende íntegramente los tres objetivos específicos de la
investigación, manteniéndose dentro de los límites académicos, de simulación y de datos
sintéticos definidos para el estudio.

---

### Anexo: índice de figuras del Capítulo VI y archivos de origen

| Figura | Diagrama / Captura | Archivo |
|--------|--------------------|---------|
| Figura 6.1 | Diagrama general de casos de uso | `6.10.1_casos_uso.png` |
| Figura 6.2 | Diagrama de componentes (SOA) | `6.10.6_componentes.png` |
| Figura 6.3 | Diagrama de despliegue | `6.10.8_despliegue.png` |
| Figura 6.4 | Diagrama de clases | `6.10.5_clases.png` |
| Figura 6.5 | Diagrama de actividad — ciclo de simulación | `6.10.2_actividad_ciclo.png` |
| Figura 6.6 | Diagrama de secuencia — iniciar simulación | `6.10.3_secuencia_iniciar.png` |
| Figura 6.7 | Diagrama de secuencia — pérdida de comunicación | `6.10.4_secuencia_perdida_comunicacion.png` |
| Figura 6.8 | Diagrama de estados de una unidad simulada | `6.10.7_estados_unidad.png` |
| Figura 6.9 – 6.14 | Capturas del prototipo en ejecución | (a incorporar por el autor) |
