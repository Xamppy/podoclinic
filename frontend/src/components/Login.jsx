const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const response = await authService.login({
            username: username,
            password: password
        });
        
        // Manejar el éxito del login
        console.log('Login exitoso:', response);
        
    } catch (error) {
        // Manejar el error
        console.error('Error en login:', error);
    }
}; 