#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('ACCESSIBILITY COMPLIANCE CHECK');
console.log('============================================================');

// Verificar elementos de accesibilidad en componentes
function checkAccessibilityFeatures() {
  console.log('\n----------------------------------------');
  console.log('Checking Accessibility Features');
  console.log('----------------------------------------');

  const checks = [
    {
      name: 'ARIA Labels',
      files: ['src/components/**/*.jsx', 'src/pages/**/*.jsx'],
      pattern: /aria-label|aria-labelledby|aria-describedby/g,
      required: true
    },
    {
      name: 'Keyboard Navigation',
      files: ['src/utils/accessibility.js'],
      pattern: /handleEscape|handleActivation|trapFocus/g,
      required: true
    },
    {
      name: 'Focus Management',
      files: ['src/components/common/TouchModal.jsx'],
      pattern: /manageFocus|trapFocus|restoreFocus/g,
      required: true
    },
    {
      name: 'Screen Reader Support',
      files: ['src/utils/accessibility.js'],
      pattern: /announceToScreenReader|sr-only/g,
      required: true
    },
    {
      name: 'Skip Links',
      files: ['src/App.jsx'],
      pattern: /skip-link|main-content/g,
      required: true
    }
  ];

  let passedChecks = 0;
  const totalChecks = checks.length;

  checks.forEach(check => {
    console.log(`\n📋 Checking: ${check.name}`);
    
    let found = false;
    check.files.forEach(filePattern => {
      const files = findFiles(filePattern);
      files.forEach(file => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const matches = content.match(check.pattern);
          if (matches && matches.length > 0) {
            found = true;
            console.log(`   ✅ Found in ${file}: ${matches.length} instances`);
          }
        }
      });
    });

    if (found) {
      passedChecks++;
      console.log(`   ✅ ${check.name}: PASS`);
    } else {
      console.log(`   ❌ ${check.name}: FAIL`);
    }
  });

  console.log(`\n📊 Accessibility Features: ${passedChecks}/${totalChecks} passed`);
  return passedChecks === totalChecks;
}

// Verificar contraste de colores en CSS
function checkColorContrast() {
  console.log('\n----------------------------------------');
  console.log('Checking Color Contrast');
  console.log('----------------------------------------');

  const cssFiles = [
    'src/styles/responsive.css',
    'src/pages/AdminCitasPage.css',
    'tailwind.config.js'
  ];

  let contrastIssues = 0;

  cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Buscar combinaciones de colores problemáticas
      const lightOnLight = content.match(/color:\s*#[f-f][f-f][f-f].*background.*#[f-f][f-f][f-f]/gi);
      const darkOnDark = content.match(/color:\s*#[0-3][0-3][0-3].*background.*#[0-3][0-3][0-3]/gi);
      
      if (lightOnLight || darkOnDark) {
        contrastIssues++;
        console.log(`   ⚠️  Potential contrast issues in ${file}`);
      } else {
        console.log(`   ✅ ${file}: No obvious contrast issues`);
      }
    }
  });

  // Verificar soporte para high contrast
  const responsiveCss = 'src/styles/responsive.css';
  if (fs.existsSync(responsiveCss)) {
    const content = fs.readFileSync(responsiveCss, 'utf8');
    if (content.includes('prefers-contrast: high')) {
      console.log('   ✅ High contrast mode support: FOUND');
    } else {
      console.log('   ❌ High contrast mode support: MISSING');
      contrastIssues++;
    }
  }

  console.log(`\n📊 Color Contrast: ${contrastIssues === 0 ? 'PASS' : 'ISSUES FOUND'}`);
  return contrastIssues === 0;
}

// Verificar navegación por teclado
function checkKeyboardNavigation() {
  console.log('\n----------------------------------------');
  console.log('Checking Keyboard Navigation');
  console.log('----------------------------------------');

  const keyboardFeatures = [
    {
      name: 'Tab Navigation',
      pattern: /tabIndex|tabindex/gi,
      files: ['src/components/**/*.jsx']
    },
    {
      name: 'Escape Key Handling',
      pattern: /key.*===.*Escape|handleEscape/gi,
      files: ['src/components/**/*.jsx', 'src/utils/accessibility.js']
    },
    {
      name: 'Enter/Space Activation',
      pattern: /key.*===.*Enter|key.*===.*\s|handleActivation/gi,
      files: ['src/components/**/*.jsx', 'src/utils/accessibility.js']
    },
    {
      name: 'Focus Styles',
      pattern: /focus:|keyboard-user/gi,
      files: ['src/styles/**/*.css']
    }
  ];

  let passedFeatures = 0;

  keyboardFeatures.forEach(feature => {
    let found = false;
    
    feature.files.forEach(filePattern => {
      const files = findFiles(filePattern);
      files.forEach(file => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.match(feature.pattern)) {
            found = true;
          }
        }
      });
    });

    if (found) {
      passedFeatures++;
      console.log(`   ✅ ${feature.name}: IMPLEMENTED`);
    } else {
      console.log(`   ❌ ${feature.name}: MISSING`);
    }
  });

  console.log(`\n📊 Keyboard Navigation: ${passedFeatures}/${keyboardFeatures.length} features`);
  return passedFeatures === keyboardFeatures.length;
}

// Verificar soporte para tecnologías asistivas
function checkAssistiveTechnology() {
  console.log('\n----------------------------------------');
  console.log('Checking Assistive Technology Support');
  console.log('----------------------------------------');

  const features = [
    {
      name: 'ARIA Roles',
      pattern: /role=["'](?:button|dialog|menu|menuitem|navigation|main|banner)/gi
    },
    {
      name: 'ARIA Properties',
      pattern: /aria-(?:expanded|hidden|live|atomic|describedby|labelledby)/gi
    },
    {
      name: 'Semantic HTML',
      pattern: /<(?:main|nav|header|footer|section|article|aside)/gi
    },
    {
      name: 'Screen Reader Text',
      pattern: /sr-only|screen-reader/gi
    }
  ];

  const componentFiles = findFiles('src/components/**/*.jsx').concat(findFiles('src/pages/**/*.jsx'));
  let totalFeatures = 0;
  let foundFeatures = 0;

  features.forEach(feature => {
    let featureFound = false;
    
    componentFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const matches = content.match(feature.pattern);
        if (matches && matches.length > 0) {
          featureFound = true;
          foundFeatures += matches.length;
        }
      }
    });

    totalFeatures++;
    if (featureFound) {
      console.log(`   ✅ ${feature.name}: FOUND`);
    } else {
      console.log(`   ❌ ${feature.name}: MISSING`);
    }
  });

  console.log(`\n📊 Assistive Technology: ${foundFeatures} features found`);
  return foundFeatures > 0;
}

// Generar reporte de accesibilidad
function generateAccessibilityReport() {
  console.log('\n----------------------------------------');
  console.log('Accessibility Recommendations');
  console.log('----------------------------------------');

  const recommendations = [
    '🎯 Test with screen readers (NVDA, JAWS, VoiceOver)',
    '⌨️  Test all functionality with keyboard only',
    '🔍 Use browser accessibility dev tools',
    '📱 Test on real mobile devices with assistive tech',
    '🎨 Verify color contrast ratios meet WCAG AA standards',
    '🔊 Test with voice control software',
    '⚡ Test with reduced motion preferences',
    '📋 Validate HTML for semantic correctness'
  ];

  recommendations.forEach(rec => console.log(rec));
}

// Función auxiliar para encontrar archivos
function findFiles(pattern) {
  // Implementación simplificada - en producción usar glob
  const files = [];
  
  if (pattern.includes('components')) {
    const componentsDir = 'src/components';
    if (fs.existsSync(componentsDir)) {
      const walkDir = (dir) => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (item.endsWith('.jsx')) {
            files.push(fullPath);
          }
        });
      };
      walkDir(componentsDir);
    }
  }
  
  if (pattern.includes('pages')) {
    const pagesDir = 'src/pages';
    if (fs.existsSync(pagesDir)) {
      const items = fs.readdirSync(pagesDir);
      items.forEach(item => {
        if (item.endsWith('.jsx')) {
          files.push(path.join(pagesDir, item));
        }
      });
    }
  }
  
  if (pattern.includes('styles')) {
    const stylesDir = 'src/styles';
    if (fs.existsSync(stylesDir)) {
      const items = fs.readdirSync(stylesDir);
      items.forEach(item => {
        if (item.endsWith('.css')) {
          files.push(path.join(stylesDir, item));
        }
      });
    }
  }
  
  return files;
}

// Ejecutar todas las verificaciones
try {
  const accessibilityFeatures = checkAccessibilityFeatures();
  const colorContrast = checkColorContrast();
  const keyboardNav = checkKeyboardNavigation();
  const assistiveTech = checkAssistiveTechnology();
  
  generateAccessibilityReport();
  
  console.log('\n============================================================');
  console.log('ACCESSIBILITY COMPLIANCE SUMMARY');
  console.log('============================================================');
  
  const results = [
    { name: 'Accessibility Features', passed: accessibilityFeatures },
    { name: 'Color Contrast', passed: colorContrast },
    { name: 'Keyboard Navigation', passed: keyboardNav },
    { name: 'Assistive Technology', passed: assistiveTech }
  ];
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASS' : 'NEEDS WORK'}`);
  });
  
  const overallScore = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`\n🎯 Overall Accessibility Score: ${overallScore}/${totalTests} (${Math.round(overallScore/totalTests*100)}%)`);
  
  if (overallScore === totalTests) {
    console.log('🎉 Excellent! Your app meets basic accessibility standards.');
  } else if (overallScore >= totalTests * 0.75) {
    console.log('👍 Good accessibility implementation. Consider addressing remaining issues.');
  } else {
    console.log('⚠️  Accessibility needs improvement. Please address the failing checks.');
  }
  
} catch (error) {
  console.error('❌ Error during accessibility check:', error.message);
  process.exit(1);
}