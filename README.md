# Podoclinic - Sistema de Gestión Clínica

## Requisitos Previos

Antes de comenzar, asegúrese de tener instalado:
1. Docker Desktop (https://www.docker.com/products/docker-desktop)
2. Git (opcional, solo si desea actualizar la aplicación)

## Instalación

1. Descargue la carpeta `Podoclinic` en su computadora
2. Asegúrese de que Docker Desktop esté en ejecución
3. Haga doble clic en el archivo `start.bat`
4. Espere a que la aplicación se inicie (esto puede tomar unos minutos la primera vez)

## Acceso a la Aplicación

Una vez que la aplicación esté en ejecución:
- Abra su navegador web
- Visite: http://localhost
- Inicie sesión con las siguientes credenciales:
  - Usuario: admin
  - Contraseña: admin123

## Detener la Aplicación

Para detener la aplicación:
1. Haga doble clic en el archivo `stop.bat`
2. Espere a que se complete el proceso

## Solución de Problemas

Si encuentra algún problema:

1. **La aplicación no inicia**
   - Verifique que Docker Desktop esté en ejecución
   - Asegúrese de que no haya otra aplicación usando el puerto 80
   - Intente reiniciar Docker Desktop

2. **No puedo acceder a la aplicación**
   - Verifique que la URL sea correcta: http://localhost
   - Asegúrese de que el navegador no esté bloqueando el acceso
   - Intente usar otro navegador

3. **Problemas con la base de datos**
   - Detenga la aplicación usando `stop.bat`
   - Elimine la carpeta `postgres_data` (si existe)
   - Inicie la aplicación nuevamente con `start.bat`

## Soporte Técnico

Si necesita ayuda adicional, por favor contacte al soporte técnico:
- Email: soporte@podoclinic.com
- Teléfono: (123) 456-7890

## Notas Importantes

- No cierre la ventana de Docker Desktop mientras la aplicación esté en uso
- Realice copias de seguridad regulares de sus datos
- Mantenga su sistema operativo y Docker Desktop actualizados
- No modifique los archivos de configuración a menos que se le indique específicamente 