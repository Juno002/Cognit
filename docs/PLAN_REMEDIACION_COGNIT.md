# Plan de Remediacion Integral de Cognit

Fecha: 2026-04-18

## Resumen

Este plan corrige primero la frontera de confianza del producto y luego estabiliza la arquitectura para que la app vuelva a cumplir su promesa principal: datos sensibles cifrados, estado consistente, validaciones confiables y experiencia offline razonable.

La implementacion se ejecutara en este orden:

1. Seguridad de datos.
2. Store unico y flujos.
3. Correccion analitica, i18n y accesibilidad.
4. Rendimiento, PWA y guardrails de calidad.
5. Documentacion y alineacion de claims.

## Estado de ejecucion 2026-04-21

Avance aplicado en esta sesion:

- Boveda versionada v2 con normalizacion de datos legados.
- Drafts sensibles movidos a la boveda cifrada.
- Backup JSON cifrado con hash SHA-256 y soporte de importacion de backups cifrados o JSON legado migrado.
- Cambio de contrasena validando la contrasena actual y lockout persistente no clinico.
- `JournalProvider` como fuente unica de verdad para el estado clinico.
- `addNewEntry` convertido a union discriminada; crisis y rumiacion ya no borran texto por control de flujo accidental.
- Eliminacion de HTML crudo en superficies revisadas y reemplazo por render seguro.
- Analitica corregida para ventanas equivalentes e inmutabilidad.
- PWA y bundle endurecidos: registro idempotente, layout server, imports dinamicos y cache offline mas honesta.
- Guardrails reactivados: ESLint plano, typecheck determinista, Vitest y build sin ignores.
- FHIR actualizado a semantica defensiva de auto-reporte sin LOINC ficticio ni interpretacion "Normal" automatica.
- Tooling muerto retirado: Genkit, Capacitor y parsers PDF de uso unico.

Validaciones automatizadas esperadas como criterio de cierre:

- `npm audit`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run`
- `npm run build`

## Objetivos

- Eliminar persistencia sensible en texto plano fuera de la boveda cifrada.
- Convertir el estado clinico en una sola fuente de verdad compartida.
- Corregir errores funcionales reales en crisis flow, import/export y analitica.
- Reducir friccion UX y deuda tecnica que hoy aumenta el riesgo de regresion.
- Dejar el proyecto con build, lint, typecheck y tests ejecutables de forma confiable.

## Alcance

Este plan cubre seguridad local, persistencia, import/export, arquitectura de estado, analitica, accesibilidad, i18n, rendimiento del bundle, PWA y documentacion.

Queda fuera de este pase:

- Backend o sincronizacion en nube.
- Cuentas de usuario.
- Notificaciones reales.
- Backend, app movil nativa o sincronizacion multi-dispositivo automatica.

## Fase 1. Seguridad y datos

### 1.1 Boveda versionada

- Introducir `CURRENT_VAULT_SCHEMA_VERSION = 2`.
- Extender `VaultData` para incluir `schemaVersion`.
- Ejecutar migracion explicita al desbloquear la boveda.
- Normalizar datos legados antes de llegar al estado React.

### 1.2 Borradores sensibles dentro de la boveda

- Añadir `drafts` a `VaultData`.
- Mover a la boveda cifrada:
  - borrador del formulario TCC;
  - estado de la cadena de flecha descendente;
  - borrador de gratitud.
- Eliminar persistencia sensible en `localStorage` y `sessionStorage`.
- Permitir fuera de la boveda solo metadatos no clinicos:
  - `locale`;
  - estado de lockout.

### 1.3 Backup cifrado versionado

- Reemplazar el JSON exportado plano por un sobre cifrado versionado.
- Reutilizar el paquete cifrado actual y serializarlo en base64.
- Incluir hash SHA-256 para integridad.

Formato objetivo:

```json
{
  "kind": "cognit-backup",
  "version": 2,
  "format": "encrypted-vault",
  "createdAt": "ISO string",
  "payloadBase64": "string",
  "sha256Base64": "string"
}
```

- `Export JSON` pasa a ser `Backup cifrado (JSON)`.
- `Auto-ZIP` debe incluir:
  - el backup cifrado;
  - exportaciones legibles por humanos.
- Markdown, CSV y FHIR seguiran siendo plaintext, pero con copy explicito de que no son cifrados.

### 1.4 Importacion segura y completa

- Soportar dos formatos:
  - backup cifrado nuevo;
  - JSON legado plano.
- Toda importacion debe reemplazar la boveda completa.
- El JSON legado debe migrarse y cifrarse inmediatamente.
- Eliminar el merge implicito actual para evitar estados mezclados.

### 1.5 Cambio de contrasena y lockout

- Verificar la contrasena actual antes de re-encriptar la boveda.
- Persistir `attemptsLeft` y `lockedUntil` en un key no sensible para que sobrevivan a recargas.
- Ampliar autolock para escuchar:
  - `pointerdown`;
  - `touchstart`;
  - `keydown`;
  - `visibilitychange`.

## Fase 2. Estado unico y flujos

### 2.1 JournalProvider como fuente unica de verdad

- Extraer la logica de `use-cbt-journal` a un `JournalProvider`.
- Montarlo una sola vez debajo de `VaultProvider`.
- Hacer que todos los consumidores lean del mismo contexto.
- Exponer `useJournal()` como API principal.
- Mantener `useCbtJournal()` como alias fino durante la migracion interna.

### 2.2 Rehacer el contrato de `addNewEntry`

- Dejar de usar `throw` para control de flujo.
- Devolver una union discriminada:

```ts
type AddEntryResult =
  | { status: "saved"; entryId: string }
  | { status: "crisis_detected" }
  | { status: "rumination_blocked" }
  | { status: "validation_error"; message: string };
```

- Limpiar draft y cerrar formulario solo cuando `status === "saved"`.
- Si hay crisis o bloqueo por rumiacion, conservar el texto intacto.
- Mostrar el modal de crisis sin perder lo escrito ni cerrar el formulario.

### 2.3 Consistencia entre modulos

- Cambios desde metas, meditacion, defusion, ajustes y listas deben reflejarse de inmediato en toda la UI.
- Eliminar estados paralelos que hoy provocan desincronizacion.

## Fase 3. Correccion funcional, i18n y accesibilidad

### 3.1 Eliminar HTML crudo en traducciones

- Quitar `dangerouslySetInnerHTML` de analisis, alertas y modales.
- Pasar de traducciones con HTML embebido a composicion JSX explicita.
- Evitar interpolaciones sin escape en contenido influenciado por el usuario.

### 3.2 Corregir analitica

- `compareLastDays(days)` debe comparar:
  - ventana reciente;
  - ventana inmediatamente anterior del mismo tamano.
- Todas las ordenaciones deben operar sobre copias inmutables.
- Corregir `negativeStreak` y utilidades relacionadas para que no muten arrays.
- En ERP, ordenar por fecha ISO real y no por strings localizados.

### 3.3 I18n y accesibilidad

- Unificar fechas y numeros con `Intl.*` segun locale activo.
- Sincronizar `document.documentElement.lang` con el locale real.
- Parametrizar voz y reconocimiento:
  - `es -> es-ES`;
  - `en -> en-US`.
- Agregar etiquetas faltantes a controles clave, incluyendo:
  - FAB principal;
  - rating de sueno;
  - controles sin `aria-label`.
- Retirar el selector no funcional de recordatorio diario en ajustes.

## Fase 4. PWA, arquitectura y rendimiento

### 4.1 Service worker y offline

- Registrar el service worker una sola vez dentro de `useEffect`.
- Evitar listeners repetidos.
- Hacer que la navegacion offline sirva el shell cacheado de `/` tras una primera carga online exitosa.
- Mantener `/offline` solo como ultimo fallback.

### 4.2 Reducir bundle inicial

- Convertir `src/app/layout.tsx` en server component.
- Mover providers cliente a un componente dedicado.
- Sacar el registro PWA del render de `page.tsx`.
- Cargar bajo demanda:
  - analitica;
  - wellness;
  - goals;
  - exposure;
  - settings;
  - impresion.
- Cargar `JSZip` dinamicamente solo dentro del handler de exportacion.

### 4.3 Mantener continuidad visual

- No hacer rediseño amplio en este pase.
- Limitar cambios visuales a labels, copy, estados y accesibilidad.

## Fase 5. Calidad y alineacion operativa

### 5.1 Reactivar guardrails

- Eliminar `typescript.ignoreBuildErrors`.
- Eliminar `eslint.ignoreDuringBuilds`.
- Eliminar `swcMinify` invalido.
- Crear configuracion real de ESLint.
- Cambiar `lint` a un comando no interactivo.
- Hacer `typecheck` determinista quitando `.next/types/**/*.ts` si no se necesitan typed routes generados.

### 5.2 Suite minima de pruebas

- Incorporar `Vitest + Testing Library`.
- Cubrir:
  - vault;
  - import/export;
  - crisis flow;
  - provider unico;
  - analitica;
  - privacidad de drafts.

### 5.3 Documentacion y claims

- Alinear README y copy interno con el comportamiento real.
- Dejar claro:
  - backup JSON cifrado;
  - exportaciones legibles no cifradas;
  - soporte offline tras primera carga;
  - limitaciones reales del producto.

## Cambios de API, tipos e interfaces

### `VaultData` v2

```ts
type VaultData = {
  schemaVersion: number;
  drafts?: {
    thoughtForm?: Record<string, unknown>;
    gratitude?: string[];
  };
  // resto del estado persistido
};
```

### `useCbtJournal`

- Deja de ser hook con estado autonomo.
- Pasa a consumir contexto compartido.
- `useJournal()` sera la API principal.

### `addNewEntry`

- Cambia de `throw` a retorno discriminado por `status`.
- El flujo UI deja de depender de excepciones para navegar estados esperados.

### Formato publico de backup

- Se introduce `cognit-backup v2`.
- La importacion deja de ser merge implicito y pasa a reemplazo explicito de la boveda.

## Plan de pruebas

### Vault

- Crear boveda, bloquear y desbloquear.
- Cambiar contrasena correcta e incorrecta.
- Validar lockout tras intentos fallidos.
- Verificar persistencia del lockout despues de recarga.
- Verificar autolock con interaccion tactil y teclado.

### Privacidad

- Confirmar que no aparece contenido clinico en `localStorage`.
- Confirmar que no aparece contenido clinico en `sessionStorage`.
- Validar que los drafts sobreviven solo dentro de la boveda cifrada.

### Backup e importacion

- Roundtrip completo con metas, sueno, gratitud, logros, configuracion y drafts.
- Importacion de JSON legado con migracion y re-cifrado.
- Rechazo del backup cifrado cuando falle la verificacion del hash.

### Estado unico

- Cambios en ajustes, metas, meditacion y defusion deben reflejarse sin refresh en journal y dashboards.

### Crisis y rumiacion

- Deteccion de crisis no borra texto ni cierra el formulario.
- Bloqueo por rumiacion conserva draft y muestra el modal correcto.

### Analitica

- Comparacion temporal usa ventanas equivalentes.
- Streaks y graficas no mutan arrays originales.
- ERP ordena correctamente las series en `es` y `en`.

### Operativo

- `npm run lint` debe pasar.
- `npm run typecheck` debe pasar.
- `npm run test` debe pasar.
- `npm run build` debe pasar.
- Validacion manual offline despues de una primera carga online exitosa.

## Orden sugerido de ejecucion en la proxima sesion

1. Estabilizar la seguridad base:
   - schema v2;
   - drafts cifrados;
   - cambio de contrasena;
   - lockout persistente.
2. Introducir `JournalProvider` y migrar consumidores.
3. Rehacer `addNewEntry` y corregir el flujo de crisis.
4. Corregir import/export para reemplazo total y backup cifrado.
5. Arreglar analitica, `dangerouslySetInnerHTML`, i18n y accesibilidad.
6. Reducir bundle inicial y corregir PWA/offline.
7. Reactivar lint, typecheck y tests.
8. Actualizar README y copy final.

## Criterio de cierre de este plan

Se considerara completado cuando:

- no exista persistencia sensible en texto plano fuera de la boveda;
- exista una sola fuente de verdad para el estado clinico;
- crisis flow, import/export y analitica sean confiables;
- el proyecto pase `lint`, `typecheck`, `test` y `build`;
- la documentacion ya no prometa comportamientos que el producto no cumple.

## Suposiciones

- No se añadira backend en este ciclo.
- Los backups legados planos seguiran siendo legibles por compatibilidad.
- Las nuevas exportaciones JSON seran cifradas por defecto.
- FHIR, CSV y Markdown seguiran siendo exportaciones plaintext por diseño.
- Las notificaciones quedan fuera de este pase y su UI incompleta debe retirarse.
