/** @type {import('tailwindcss').Config} */
export default {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
       "./public/index.html",
     ],
     // Optimización del bundle para producción
     purge: {
       enabled: process.env.NODE_ENV === 'production',
       content: [
         './src/**/*.{js,jsx,ts,tsx}',
         './public/index.html',
       ],
       options: {
         safelist: [
           // Clases dinámicas que no se pueden detectar automáticamente
           /^(xs|sm|md|lg|xl|2xl):/,
           /^grid-cols-/,
           /^col-span-/,
           /^gap-/,
           /^p-/,
           /^m-/,
           /^text-/,
           /^bg-/,
           /^border-/,
           /^rounded-/,
           /^shadow-/,
           /^transition-/,
           /^duration-/,
           /^ease-/,
           /^transform/,
           /^translate-/,
           /^scale-/,
           /^rotate-/,
           /^opacity-/,
           'touch-target',
           'touch-target-lg',
           'container-responsive',
           'modal-responsive',
           'modal-content-responsive',
           'form-responsive',
           'form-grid-responsive',
           'table-responsive',
           'table-card-mobile',
           'table-desktop',
         ],
       },
     },
     theme: {
       extend: {
         // Responsive breakpoints personalizados
         screens: {
           'xs': '475px',
           // sm: '640px' (default)
           // md: '768px' (default)
           // lg: '1024px' (default)
           // xl: '1280px' (default)
           // 2xl: '1536px' (default)
         },
         // Espaciado responsivo personalizado
         spacing: {
           'safe-top': 'env(safe-area-inset-top)',
           'safe-bottom': 'env(safe-area-inset-bottom)',
           'safe-left': 'env(safe-area-inset-left)',
           'safe-right': 'env(safe-area-inset-right)',
         },
         // Alturas mínimas para touch targets
         minHeight: {
           'touch': '44px',
           'touch-lg': '48px',
         },
         minWidth: {
           'touch': '44px',
           'touch-lg': '48px',
         },
         // Tipografía responsiva
         fontSize: {
           'xs-responsive': ['0.75rem', { lineHeight: '1rem' }],
           'sm-responsive': ['0.875rem', { lineHeight: '1.25rem' }],
           'base-responsive': ['1rem', { lineHeight: '1.5rem' }],
           'lg-responsive': ['1.125rem', { lineHeight: '1.75rem' }],
           'xl-responsive': ['1.25rem', { lineHeight: '1.75rem' }],
         },
         // Animaciones suaves para responsive
         transitionDuration: {
           '250': '250ms',
           '350': '350ms',
         },
         // Z-index consistente
         zIndex: {
           'dropdown': '1000',
           'sticky': '1020',
           'fixed': '1030',
           'modal-backdrop': '1040',
           'modal': '1050',
           'popover': '1060',
           'tooltip': '1070',
         }
       },
     },
     plugins: [
       // Plugin personalizado para utilidades responsivas
       function({ addUtilities, theme }) {
         const newUtilities = {
           // Touch-friendly utilities
           '.touch-target': {
             minHeight: theme('minHeight.touch'),
             minWidth: theme('minWidth.touch'),
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
           },
           '.touch-target-lg': {
             minHeight: theme('minHeight.touch-lg'),
             minWidth: theme('minWidth.touch-lg'),
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
           },
           // Safe area utilities
           '.safe-top': {
             paddingTop: 'env(safe-area-inset-top)',
           },
           '.safe-bottom': {
             paddingBottom: 'env(safe-area-inset-bottom)',
           },
           '.safe-left': {
             paddingLeft: 'env(safe-area-inset-left)',
           },
           '.safe-right': {
             paddingRight: 'env(safe-area-inset-right)',
           },
           '.safe-x': {
             paddingLeft: 'env(safe-area-inset-left)',
             paddingRight: 'env(safe-area-inset-right)',
           },
           '.safe-y': {
             paddingTop: 'env(safe-area-inset-top)',
             paddingBottom: 'env(safe-area-inset-bottom)',
           },
           // Responsive container utilities
           '.container-responsive': {
             width: '100%',
             paddingLeft: '1rem',
             paddingRight: '1rem',
             '@screen sm': {
               paddingLeft: '1.5rem',
               paddingRight: '1.5rem',
             },
             '@screen lg': {
               paddingLeft: '2rem',
               paddingRight: '2rem',
             },
           },
           // Modal responsive utilities
           '.modal-responsive': {
             position: 'fixed',
             inset: '0',
             zIndex: theme('zIndex.modal'),
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             padding: '0.5rem',
             '@screen sm': {
               padding: '1rem',
             },
           },
           '.modal-content-responsive': {
             width: '100%',
             maxWidth: '100%',
             maxHeight: 'calc(100vh - 1rem)',
             overflowY: 'auto',
             '@screen sm': {
               maxHeight: 'calc(100vh - 2rem)',
               maxWidth: '42rem',
             },
           },
           // Form responsive utilities
           '.form-responsive': {
             display: 'grid',
             gap: '1rem',
             '@screen sm': {
               gap: '1.5rem',
             },
           },
           '.form-grid-responsive': {
             display: 'grid',
             gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
             gap: '1rem',
             '@screen sm': {
               gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
               gap: '1.5rem',
             },
           },
           // Table responsive utilities
           '.table-responsive': {
             display: 'block',
             '@screen sm': {
               display: 'table',
             },
           },
           '.table-card-mobile': {
             display: 'block',
             '@screen sm': {
               display: 'none',
             },
           },
           '.table-desktop': {
             display: 'none',
             '@screen sm': {
               display: 'block',
             },
           },
         };
         
         addUtilities(newUtilities);
       },
     ],
   }