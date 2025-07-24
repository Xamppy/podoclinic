import React from 'react';
import { getResponsiveClasses, formatResponsiveText } from '../../utils/responsive';

/**
 * Componente de texto responsivo con diferentes variantes
 */
const ResponsiveText = ({
  children,
  variant = 'body',
  as = 'p',
  truncate = false,
  maxLengthMobile = 50,
  maxLengthDesktop = 100,
  className = '',
  ...props
}) => {
  const Component = as;
  const responsiveClasses = getResponsiveClasses('text', variant);
  
  // Formatear texto si se requiere truncado
  const displayText = truncate 
    ? formatResponsiveText(children, maxLengthMobile, maxLengthDesktop)
    : children;

  const finalClasses = `${responsiveClasses} ${className}`;

  return (
    <Component className={finalClasses} {...props}>
      {displayText}
    </Component>
  );
};

/**
 * Componentes específicos para diferentes tipos de texto
 */
export const ResponsiveHeading = (props) => (
  <ResponsiveText variant="heading" as="h1" {...props} />
);

export const ResponsiveSubheading = (props) => (
  <ResponsiveText variant="subheading" as="h2" {...props} />
);

export const ResponsiveBody = (props) => (
  <ResponsiveText variant="body" as="p" {...props} />
);

export const ResponsiveSmall = (props) => (
  <ResponsiveText variant="small" as="span" {...props} />
);

export default ResponsiveText;