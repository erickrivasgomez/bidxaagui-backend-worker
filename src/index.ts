interface Env {
  // Define las variables de entorno que necesites
  ENVIRONMENT: 'development' | 'production';
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    
    // Ruta de prueba
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          message: 'Worker is running!',
          environment: env.ENVIRONMENT || 'development',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Respuesta por defecto
    return new Response(
      JSON.stringify({
        status: 'ok',
        message: 'Welcome to the API',
        endpoints: ['/api/health'],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  },
};
