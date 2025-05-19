#
# Base image stage with node
#
FROM node:22.15-alpine AS base-image

WORKDIR /app



#
# Image with sources
#
FROM base-image AS app-sources

COPY . .



#
# Backend dependencies and build
#
FROM app-sources AS backend-build

RUN cd server && yarn install --frozen-lockfile



#
# Frontend dependencies and build
#
FROM app-sources AS frontend-build

RUN yarn install --frozen-lockfile && yarn build



#
# Final app image with production dependencies
#
FROM base-image AS app-build

CMD mkdir /data && chown node:node /data

COPY --from=frontend-build /app/dist ./dist
COPY --from=backend-build /app/server ./server

USER node

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

VOLUME /data

EXPOSE 3000

CMD [ "node", "server/server.js" ]
