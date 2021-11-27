###
## Backend
###
FROM node:16-slim as builder
# install git
RUN apt update && apt install -y git
# Add a work directory
WORKDIR /app
# Cache and Install dependencies
COPY package.json .
COPY tsconfig.json .
# Install
RUN yarn install --network-timeout 1000000
# Add folders
COPY src ./src
# Build the app
RUN yarn build


###
## grpc-web proxy
###
FROM debian:buster-slim as proxy

ARG version=v0.15.0
ARG name=grpcwebproxy-${version}-linux-x86_64

RUN apt update && apt install -y unzip wget

WORKDIR /app

RUN wget https://github.com/improbable-eng/grpc-web/releases/download/${version}/${name}.zip  -O package.zip

RUN unzip package.zip && rm package.zip
RUN mv ./dist/$name ./grpcwebproxy



###
## Production
###
FROM node:16-slim as production

ENV NODE_ENV production

# install git
RUN apt update && apt install -y git 

WORKDIR /app
# Copy application code 
COPY package.json ./
COPY --from=builder /app/dist .

RUN yarn install --only=production

WORKDIR /
# Copy the proxy
COPY --from=proxy /app/grpcwebproxy .

COPY entrypoint .
RUN chmod +x entrypoint

# Expose ports
EXPOSE 8080

ENTRYPOINT ["/entrypoint"]