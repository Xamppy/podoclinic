#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('RESPONSIVE PERFORMANCE ANALYSIS');
console.log('============================================================');

// Analizar el tamaño del bundle de CSS
function analyzeCSSBundle() {
  console.log('\n----------------------------------------');
  console.log('CSS Bundle Analysis');
  console.log('----------------------------------------');
  
  const buildPath = path.join(__dirname, '../build/static/css');
  
  if (!fs.existsSync(buildPath)) {
    console.log('❌ Build folder not found. Run "npm run build" first.');
    return;
  }
  
  const cssFiles = fs.readdirSync(buildPath).filter(file => file.endsWith('.css'));
  
  if (cssFiles.length === 0) {
    console.log('❌ No CSS files found in build.');
    return;
  }
  
  cssFiles.forEach(file => {
    const filePath = path.join(buildPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(`📄 ${file}: ${sizeKB} KB`);
    
    if (stats.size > 100 * 1024) { // > 100KB
      console.log('⚠️  CSS bundle is large. Consider optimizing.');
    } else {
      console.log('✅ CSS bundle size is optimal.');
    }
  });
}

// Analizar componentes responsivos
function analyzeResponsiveComponents() {
  console.log('\n----------------------------------------');
  console.log('Responsive Components Analysis');
  console.log('----------------------------------------');
  
  const componentsPath = path.join(__dirname, '../src/components');
  const responsiveComponents = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        scanDirectory(itemPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        const content = fs.readFileSync(itemPath, 'utf8');
        
        // Buscar patrones responsivos
        const responsivePatterns = [
          /sm:|md:|lg:|xl:|2xl:/g,
          /useResponsive/g,
          /responsive-/g,
          /touch-/g,
          /mobile|tablet|desktop/gi
        ];
        
        let responsiveScore = 0;
        responsivePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            responsiveScore += matches.length;
          }
        });
        
        if (responsiveScore > 0) {
          responsiveComponents.push({
            file: path.relative(componentsPath, itemPath),
            score: responsiveScore,
            size: stat.size
          });
        }
      }
    });
  }
  
  scanDirectory(componentsPath);
  
  console.log(`📱 Found ${responsiveComponents.length} responsive components:`);
  
  responsiveComponents
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .forEach(comp => {
      const sizeKB = (comp.size / 1024).toFixed(2);
      console.log(`   ${comp.file} (Score: ${comp.score}, Size: ${sizeKB}KB)`);
    });
}

// Analizar hooks responsivos
function analyzeResponsiveHooks() {
  console.log('\n----------------------------------------');
  console.log('Responsive Hooks Analysis');
  console.log('----------------------------------------');
  
  const hooksPath = path.join(__dirname, '../src/hooks');
  
  if (!fs.existsSync(hooksPath)) {
    console.log('❌ Hooks directory not found.');
    return;
  }
  
  const hookFiles = fs.readdirSync(hooksPath).filter(file => 
    file.endsWith('.js') || file.endsWith('.jsx')
  );
  
  const responsiveHooks = hookFiles.filter(file => {
    const content = fs.readFileSync(path.join(hooksPath, file), 'utf8');
    return content.includes('responsive') || content.includes('breakpoint') || content.includes('mobile');
  });
  
  console.log(`🪝 Found ${responsiveHooks.length} responsive hooks:`);
  responsiveHooks.forEach(hook => {
    console.log(`   ${hook}`);
  });
}

// Generar recomendaciones
function generateRecommendations() {
  console.log('\n----------------------------------------');
  console.log('Performance Recommendations');
  console.log('----------------------------------------');
  
  const recommendations = [
    '🚀 Use lazy loading for non-critical responsive components',
    '📱 Implement proper touch target sizes (min 44px)',
    '🎨 Optimize CSS by purging unused responsive classes',
    '📊 Monitor responsive component re-renders',
    '🖼️  Use responsive images with proper srcSet',
    '⚡ Debounce resize events to improve performance',
    '📦 Consider code splitting for mobile-specific components',
    '🔍 Test on real devices, not just browser dev tools'
  ];
  
  recommendations.forEach(rec => console.log(rec));
}

// Ejecutar análisis
try {
  analyzeCSSBundle();
  analyzeResponsiveComponents();
  analyzeResponsiveHooks();
  generateRecommendations();
  
  console.log('\n============================================================');
  console.log('ANALYSIS COMPLETE');
  console.log('============================================================');
} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  process.exit(1);
}