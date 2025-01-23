FROM node:18-slim

WORKDIR /home/perplexica

# Copy package files first for better caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy all TypeScript config and source files
COPY tsconfig.json .
COPY drizzle.config.ts .
COPY src/ src/

# Create necessary directories
RUN mkdir -p data uploads dist

# Build TypeScript
RUN yarn tsc

# Debug: List contents of directories
RUN echo "Contents of root directory:" && \
    ls -la && \
    echo "Contents of dist directory:" && \
    ls -la dist/

# Start the application
CMD ["yarn", "start"]