import React, { useEffect, useRef } from 'react';

const MobileCalendarWrapper = ({ children, onDateSelect }) => {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleInteraction = (event) => {
      // Solo procesar en dispositivos móviles
      if (window.innerWidth >= 768) return;

      // No procesar si el clic fue en la toolbar del calendario (botones de navegación)
      if (event.target.closest('.rbc-toolbar')) {
        console.log('🎯 MobileCalendarWrapper: Ignorando clic en toolbar');
        return;
      }
      
      // No procesar si el clic fue en cualquier botón
      if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
        console.log('🎯 MobileCalendarWrapper: Ignorando clic en botón');
        return;
      }

      // Buscar la celda de fecha más cercana
      let target = event.target;
      let attempts = 0;
      const maxAttempts = 10;

      while (target && attempts < maxAttempts) {
        
        // Buscar diferentes tipos de celdas del calendario
        if (target.classList.contains('rbc-date-cell') ||
            target.classList.contains('rbc-day-bg') ||
            (target.tagName === 'TD' && target.closest('.rbc-month-view'))) {
          
          // Extraer la fecha
          let dateText = '';
          
          // Método 1: Buscar en links o spans
          const dateElement = target.querySelector('a, span') || target;
          if (dateElement) {
            dateText = dateElement.textContent.trim();
          }
          
          // Método 2: Si no hay texto, buscar en el contenido de la celda
          if (!dateText) {
            dateText = target.textContent.trim();
          }
          
          // Extraer solo el número
          const match = dateText.match(/(\d+)/);
          if (match) {
            const dayNumber = parseInt(match[1]);
            
            if (dayNumber >= 1 && dayNumber <= 31) {
              const currentDate = new Date();
              const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
              
              // Ajustar mes si es necesario (días del mes anterior/siguiente)
              if (target.classList.contains('rbc-off-range')) {
                if (dayNumber > 15 && currentDate.getDate() < 15) {
                  selectedDate.setMonth(currentDate.getMonth() - 1);
                } else if (dayNumber < 15 && currentDate.getDate() > 15) {
                  selectedDate.setMonth(currentDate.getMonth() + 1);
                }
              }
              

              
              // Prevenir eventos duplicados
              event.preventDefault();
              event.stopPropagation();
              
              // Llamar al callback
              onDateSelect({
                start: selectedDate,
                end: selectedDate,
                slots: [selectedDate],
                action: 'mobile-touch'
              });
              
              return;
            }
          }
        }
        
        target = target.parentElement;
        attempts++;
      }
      
      console.log("🎯 No se encontró celda de fecha válida");
    };

    // Agregar listeners
    wrapper.addEventListener('click', handleInteraction, { passive: false });
    wrapper.addEventListener('touchend', handleInteraction, { passive: false });

    return () => {
      wrapper.removeEventListener('click', handleInteraction);
      wrapper.removeEventListener('touchend', handleInteraction);
    };
  }, [onDateSelect]);

  return (
    <div ref={wrapperRef} className="mobile-calendar-wrapper">
      {children}
    </div>
  );
};

export default MobileCalendarWrapper;