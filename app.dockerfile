FROM node:20.18.0-alpine

ARG NEXT_PUBLIC_WS_URL=ws://127.0.0.1:3001
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /home/perplexica

# Create ui directory and set it as working directory
RUN mkdir -p ui
WORKDIR /home/perplexica/ui

# Copy package files to ui directory
COPY ui/package.json ui/yarn.lock ./

# Clean install dependencies
RUN yarn install 

# Copy the rest of the UI files
COPY ui/ ./

# Build the application
RUN yarn build

# Start the application
CMD ["yarn", "start"]