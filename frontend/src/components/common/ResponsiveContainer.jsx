import React from 'react';
import { getResponsiveClasses } from '../../utils/responsive';

/**
 * Componente de contenedor responsivo
 */
const ResponsiveContainer = ({
  children,
  variant = 'default',
  className = '',
  as = 'div',
  ...props
}) => {
  const Component = as;
  const responsiveClasses = getResponsiveClasses('container', variant);
  const finalClasses = `${responsiveClasses} ${className}`;

  return (
    <Component className={finalClasses} {...props}>
      {children}
    </Component>
  );
};

/**
 * Componente de grid responsivo
 */
export const ResponsiveGrid = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const responsiveClasses = getResponsiveClasses('grid', variant);
  const finalClasses = `${responsiveClasses} ${className}`;

  return (
    <div className={finalClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * Componente de sección responsiva con espaciado
 */
export const ResponsiveSection = ({
  children,
  spacing = 'section',
  className = '',
  ...props
}) => {
  const spacingClasses = getResponsiveClasses('spacing', spacing);
  const finalClasses = `${spacingClasses} ${className}`;

  return (
    <section className={finalClasses} {...props}>
      {children}
    </section>
  );
};

export default ResponsiveContainer;