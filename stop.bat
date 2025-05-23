@echo off
echo Deteniendo Podoclinic...

REM Detener y eliminar los contenedores
docker-compose down

echo.
echo La aplicación se ha detenido correctamente.
echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause > nul 