# 🖨️ Agente Local de Impresión ESC/POS - HEIS Suite

Micro-agente nativo en **Node.js puro (0 dependencias externas)** diseñado para recibir comprobantes electrónicos, comandas y tickets de venta desde el SaaS en la nube ([https://suite.grupoheis.com](https://suite.grupoheis.com)) e imprimirlos al instante en ticketeras térmicas locales (USB o Red LAN/Wi-Fi).

---

## ⚡ Ventajas vs XAMPP / Apache / PHP
| Característica | HEIS Print Agent (Node.js) | Servidor XAMPP / PHP clásico |
| :--- | :--- | :--- |
| **Consumo de Memoria RAM** | **~22 MB** | +320 MB (Apache + PHP Engine) |
| **Instalación** | **0 dependencias** (solo `node`) | Instalador pesado (+150 MB) de XAMPP |
| **Impresoras de Red (Cocina/Barra/KDS)** | **Nativo TCP 9100** socket RAW | Requiere librerías externas o sockets PHP |
| **Seguridad de Red (CORS / Chrome PNA)** | `Access-Control-Allow-Private-Network: true` nativo | Requiere configurar `httpd.conf` y `.htaccess` |
| **Arranque en frío** | Inmediato (< 200 ms) | Lento (espera de servicios Apache) |

---

## 🚀 Puesta en Marcha en la PC de Caja (Windows)

### 1. Requisitos Previos
- Tener instalado **Node.js (versión 18, 20 o superior)** en la PC del cajero.
  - Comprobar en terminal: `node -v`

### 2. Configurar la Impresora en Windows

#### Caso A: Impresora USB
1. Ve al **Panel de Control** ➔ **Dispositivos e impresoras**.
2. Clic derecho en la ticketera (ej. POS-80) ➔ **Propiedades de la impresora**.
3. Pestaña **Compartir** ➔ Activar **"Compartir esta impresora"**.
4. Asignarle el nombre de recurso compartido: `POS-80`.
5. Clic en **Aceptar**.

#### Caso B: Impresora de Red LAN / Wi-Fi (Cocina KDS, Barra, Despacho)
- No requiere compartir en Windows.
- Solo debes conocer la dirección IP local de la ticketera (ejemplo: `192.168.1.200`).
- En HEIS Suite colocas en el campo de impresora: `192.168.1.200` o `192.168.1.200:9100`. El agente enviará la trama binaria directamente al puerto 9100 (JetDirect/RAW).

---

### 3. Iniciar el Agente
Haz doble clic sobre el archivo:
```bat
tools\iniciar-agente-impresion.bat
```
Verás la confirmación en consola:
```
🖨️  [HEIS Print Agent] Escuchando en http://127.0.0.1:9101
```

---

### 4. Configurar el Inicio Automático con Windows (Sin intervención del cajero)
Para que el agente arranque siempre que el cajero encienda la computadora:
1. Presiona las teclas `Win + R`.
2. Escribe `shell:startup` y presiona **Enter** (se abrirá la carpeta de inicio de Windows).
3. Crea un **Acceso Directo** al archivo `tools\iniciar-agente-impresion.bat`.
4. *(Opcional)* En las propiedades del acceso directo, en **Ejecutar**, selecciona **Minimizada**.

---

### 5. Vincular con HEIS Suite
1. Abre tu navegador e ingresa a [https://suite.grupoheis.com](https://suite.grupoheis.com).
2. Ve a **Configuración** ➔ pestaña **Hardware POS**.
3. En **URL del Puente Local**, coloca: `http://127.0.0.1:9101`.
4. En **Nombre de Impresora**, coloca `POS-80` (o la IP `192.168.1.200:9100` si es de red).
5. Haz clic en **"Probar Ping"** (aparecerá mensaje verde de confirmación).
6. Haz clic en **"Imprimir Ticket de Prueba"** o **"Probar Apertura de Gaveta"**.
7. Haz clic en **"Guardar en esta Terminal"**.
