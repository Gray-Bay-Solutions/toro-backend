import { CorsOptions } from 'cors';

const allowedOrigins = [
    // Development origins
    'http://localhost:3000',
    'http://localhost:3001',

    // Production origins
    'https://toroeats.com',
    'https://www.toroeats.com',
    'https://toro-backend-nine.vercel.app',
    'https://toro-frontend-seven.vercel.app',

    // FlutterFlow origins
    'https://app.flutterflow.io',
    /\.flutterflow\.io$/,
];

const defaultCorsOptions: CorsOptions = {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers'
    ],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

const productionCorsOptions: CorsOptions = {
    ...defaultCorsOptions,
    origin: (origin, callback) => {
        if (!origin) {
            // Allow requests with no origin (like mobile apps or curl requests)
            return callback(null, true);
        }

        const isAllowedOrigin = allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return allowedOrigin === origin;
        });

        if (isAllowedOrigin) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    }
};

const developmentCorsOptions: CorsOptions = {
    ...defaultCorsOptions,
    origin: '*'
};

export const corsOptions = process.env.NODE_ENV === 'production'
    ? productionCorsOptions
    : developmentCorsOptions;

// Export for testing and direct usage if needed
export { allowedOrigins, productionCorsOptions, developmentCorsOptions }; 