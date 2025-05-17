# Stage 1 
FROM node:22.15.0-alpine as app-build
RUN apk update && apk upgrade && apk add --no-cache git
WORKDIR /app
COPY . ./
RUN yarn install
RUN yarn build
RUN cd server &&  yarn install

EXPOSE 3000
CMD [ "node", "server/server.js" ]