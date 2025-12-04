let app;
let isInitialized = false;

async function initializeApp() {
  if (isInitialized) return app;
  
  try {
    const module = await import('../dist/index.js');
    app = module.default || module;
    isInitialized = true;
    console.log('App initialized successfully');
    return app;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    const expressApp = await initializeApp();
    
    // Express apps are functions that handle (req, res)
    return expressApp(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}