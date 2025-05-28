@echo off

echo Iniciando Podoclinic (inicio rápido)...

docker-compose up -d

echo.
echo La aplicación está iniciando...
echo Puede acceder a la aplicación en: http://localhost
echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause > nul 