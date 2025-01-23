# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /home/perplexica

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Add strict TypeScript checks
RUN echo '{\n\
  "compilerOptions": {\n\
    "target": "es2020",\n\
    "module": "commonjs",\n\
    "lib": ["es2020"],\n\
    "strict": true,\n\
    "esModuleInterop": true,\n\
    "skipLibCheck": true,\n\
    "forceConsistentCasingInFileNames": true,\n\
    "outDir": "./dist",\n\
    "rootDir": "./src",\n\
    "declaration": true,\n\
    "resolveJsonModule": true,\n\
    "moduleResolution": "node",\n\
    "types": ["node"]\n\
  },\n\
  "include": ["src/**/*"],\n\
  "exclude": ["node_modules"]\n\
}' > tsconfig.json

# Build TypeScript
RUN yarn tsc

# Copy remaining files
COPY . .

# Start the server
CMD ["node", "dist/index.js"]