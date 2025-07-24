# Guía de Diseño Responsivo - Podoclinic

## Introducción

Esta guía documenta la implementación del diseño responsivo en Podoclinic, incluyendo componentes, utilidades y mejores prácticas para crear interfaces que funcionen perfectamente en todos los dispositivos.

## Breakpoints

El sistema utiliza los siguientes breakpoints:

```javascript
{
  'xs': '475px',   // Móviles pequeños
  'sm': '640px',   // Móviles grandes
  'md': '768px',   // Tablets
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Desktop grande
  '2xl': '1536px'  // Desktop extra grande
}
```

## Componentes Responsivos

### ResponsiveTable

Transforma automáticamente tablas en tarjetas en dispositivos móviles.

```jsx
import ResponsiveTable from '../components/common/ResponsiveTable';

<ResponsiveTable 
  data={pacientes}
  columns={[
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' }
  ]}
  actions={[
    { label: 'Editar', onClick: handleEdit },
    { label: 'Eliminar', onClick: handleDelete }
  ]}
/>
```

### ResponsiveImage

Carga optimizada de imágenes con lazy loading y srcSet.

```jsx
import ResponsiveImage from '../components/common/ResponsiveImage';

<ResponsiveImage
  src="/logo.png"
  alt="Logo"
  className="w-32 h-auto"
  sizes="(max-width: 640px) 128px, 160px"
  loading="lazy"
/>
```

### TouchButton

Botones optimizados para interacción táctil.

```jsx
import TouchButton from '../components/common/TouchButton';

<TouchButton
  variant="primary"
  size="lg"
  onClick={handleClick}
  className="w-full sm:w-auto"
>
  Guardar
</TouchButton>
```

### TouchModal

Modales que se adaptan a pantallas móviles.

```jsx
import TouchModal from '../components/common/TouchModal';

<TouchModal
  isOpen={isOpen}
  onClose={onClose}
  title="Editar Paciente"
  size="lg"
>
  <form>
    {/* Contenido del modal */}
  </form>
</TouchModal>
```

## Hooks Responsivos

### useResponsivePerformance

Hook optimizado para detectar breakpoints con rendimiento mejorado.

```jsx
import { useResponsivePerformance } from '../hooks/useResponsivePerformance';

function MyComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsivePerformance();
  
  return (
    <div className={`
      ${isMobile ? 'p-4' : 'p-8'}
      ${isTablet ? 'grid-cols-2' : ''}
      ${isDesktop ? 'grid-cols-3' : ''}
    `}>
      {/* Contenido */}
    </div>
  );
}
```

### useSwipe

Gestos de deslizamiento para navegación móvil.

```jsx
import { useHorizontalSwipe } from '../hooks/useSwipe';

function SwipeableComponent() {
  const swipeRef = useHorizontalSwipe(
    () => console.log('Swipe left'),
    () => console.log('Swipe right'),
    { threshold: 50 }
  );
  
  return <div ref={swipeRef}>Contenido deslizable</div>;
}
```

## Utilidades CSS

### Clases Touch-Friendly

```css
.touch-target      /* Mínimo 44px x 44px */
.touch-target-lg   /* Mínimo 48px x 48px */
```

### Contenedores Responsivos

```css
.container-responsive  /* Padding adaptativo */
.form-responsive      /* Formularios adaptativos */
.form-grid-responsive /* Grid de formularios */
```

### Modales Responsivos

```css
.modal-responsive         /* Modal con posicionamiento adaptativo */
.modal-content-responsive /* Contenido de modal responsivo */
```

### Tablas Responsivas

```css
.table-responsive    /* Tabla que se adapta */
.table-card-mobile   /* Vista de tarjetas en móvil */
.table-desktop      /* Vista de tabla en desktop */
```

## Mejores Prácticas

### 1. Targets Táctiles

Todos los elementos interactivos deben tener un mínimo de 44px x 44px:

```jsx
// ✅ Correcto
<button className="touch-target px-4 py-2">
  Botón
</button>

// ❌ Incorrecto
<button className="px-1 py-1 text-xs">
  Botón muy pequeño
</button>
```

### 2. Navegación Móvil

Usar sidebar overlay en móvil, fijo en desktop:

```jsx
<div className={`
  fixed inset-y-0 left-0 z-50 w-64
  transform transition-transform duration-300
  ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  lg:translate-x-0 lg:static lg:inset-0
`}>
  {/* Contenido del sidebar */}
</div>
```

### 3. Formularios Responsivos

Usar grid adaptativo para formularios:

```jsx
<form className="form-grid-responsive">
  <input className="col-span-full sm:col-span-1" />
  <input className="col-span-full sm:col-span-1" />
  <textarea className="col-span-full" />
</form>
```

### 4. Tablas Responsivas

Transformar tablas complejas en tarjetas en móvil:

```jsx
{/* Vista de tabla en desktop */}
<div className="table-desktop">
  <table>
    {/* Tabla tradicional */}
  </table>
</div>

{/* Vista de tarjetas en móvil */}
<div className="table-card-mobile space-y-4">
  {data.map(item => (
    <div key={item.id} className="bg-white p-4 rounded-lg shadow">
      {/* Contenido de tarjeta */}
    </div>
  ))}
</div>
```

### 5. Imágenes Responsivas

Usar srcSet y sizes para optimizar carga:

```jsx
<ResponsiveImage
  src="/image.jpg"
  alt="Descripción"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
/>
```

## Optimización de Rendimiento

### 1. Lazy Loading

Usar lazy loading para componentes no críticos:

```jsx
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 2. Memoización

Memoizar componentes que no cambian frecuentemente:

```jsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Renderizado costoso */}</div>;
});
```

### 3. Debounce en Resize

Optimizar eventos de resize:

```jsx
import { debounce } from '../utils/performanceOptimization';

useEffect(() => {
  const handleResize = debounce(() => {
    // Lógica de resize
  }, 150);
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Testing Responsivo

### 1. Breakpoints de Prueba

Probar en estos tamaños específicos:

- **Móvil**: 375x667 (iPhone SE)
- **Móvil grande**: 414x896 (iPhone 11)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1440x900 (MacBook)
- **Desktop grande**: 1920x1080 (Monitor estándar)

### 2. Herramientas de Desarrollo

1. Chrome DevTools - Device Mode
2. Firefox Responsive Design Mode
3. Safari Web Inspector

### 3. Pruebas en Dispositivos Reales

Siempre probar en dispositivos físicos para validar:
- Rendimiento real
- Interacciones táctiles
- Legibilidad de texto
- Usabilidad general

## Troubleshooting

### Problemas Comunes

1. **Elementos muy pequeños en móvil**
   - Usar `touch-target` o `touch-target-lg`
   - Verificar padding mínimo

2. **Texto ilegible en móvil**
   - Usar tamaños de fuente responsivos
   - Verificar contraste de colores

3. **Tablas que se desbordan**
   - Implementar scroll horizontal
   - Usar vista de tarjetas en móvil

4. **Modales que no se ven bien en móvil**
   - Usar `modal-responsive`
   - Implementar full-screen en móvil

5. **Rendimiento lento en móvil**
   - Implementar lazy loading
   - Optimizar imágenes
   - Reducir re-renders innecesarios

## Recursos Adicionales

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Touch Target Guidelines](https://developers.google.com/web/fundamentals/accessibility/accessible-styles#multi-device_responsive_design)