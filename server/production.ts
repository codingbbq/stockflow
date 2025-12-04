import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Simple logging middleware for production
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Global flag to track initialization
let routesInitialized = false;
let initPromise: Promise<void> | null = null;

// Function to initialize routes once
async function ensureRoutesInitialized() {
  if (routesInitialized) return;
  
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await registerRoutes(app);
        routesInitialized = true;
        console.log('Routes initialized successfully');
      } catch (error) {
        console.error('Failed to initialize routes:', error);
        throw error;
      }
    })();
  }
  
  return initPromise;
}

// Middleware to ensure routes are initialized before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureRoutesInitialized();
    next();
  } catch (error) {
    next(error);
  }
});

// Error handler - must be after all routes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error('Error:', {
    status,
    message,
    stack: err.stack,
    path: _req.path,
    method: _req.method
  });
  
  res.status(status).json({ 
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel serverless
export default app;