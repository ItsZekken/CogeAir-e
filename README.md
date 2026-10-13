# CogeAir-e

Aplicación web progresiva (PWA) móvil y de escritorio para el seguimiento diario del medidor de energía eléctrica (kWh), moderación de consumo y proyección estimada al cierre del mes.

## Características

- **Proyección Fin de Mes**: Métrica central con estimación de consumo proyectado y costo en pesos colombianos.
- **Objetivos y Naturaleza**: Configuración opcional de meta mensual (Techo para minimizar, Piso para maximizar o Aproximación) con límites diarios sugeridos.
- **Almacenamiento Local (IndexedDB)**: Privacidad total, funcionamiento offline y persistencia en el dispositivo.
- **Exportación e Importación Inteligente**: Descarga y restauración completa en JSON y compatibilidad con hojas de cálculo en Excel (.xlsx).
- **Diseño Mobile-First**: Estilo Material Design 3, modo oscuro/claro y PWA instalable en Android e iOS.

## Tecnologías

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Recharts & Lucide Icons
- SheetJS (xlsx)

## Instalación y Desarrollo

```bash
npm install
npm run dev
```

Para compilar a producción:

```bash
npm run build
```
