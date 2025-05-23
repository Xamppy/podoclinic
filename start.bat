@echo off
echo Iniciando Podoclinic...

REM Construir y levantar los contenedores
docker-compose up --build -d

echo.
echo La aplicación está iniciando...
echo Por favor, espere unos momentos mientras los servicios se ponen en marcha.
echo.
echo Puede acceder a la aplicación en: http://localhost
echo.
echo Credenciales por defecto:
echo Usuario: admin
echo Contraseña: admin123
echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause > nul 