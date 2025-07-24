/**
 * Índice de utilidades para la aplicación Podoclinic
 */

// Utilidades responsivas
export * from './responsive';

// Re-exportar componentes responsivos comunes
export { default as ResponsiveImage } from '../components/common/ResponsiveImage';
export { default as ResponsiveText, ResponsiveHeading, ResponsiveSubheading, ResponsiveBody, ResponsiveSmall } from '../components/common/ResponsiveText';
export { default as ResponsiveContainer, ResponsiveGrid, ResponsiveSection } from '../components/common/ResponsiveContainer';
export { default as ResponsiveTable } from '../components/common/ResponsiveTable';