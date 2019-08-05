## Stage 1 (production base)
# This gets our prod dependencies installed and out of the way
FROM node:10-slim as base

# labels from https://github.com/opencontainers/image-spec/blob/master/annotations.md
LABEL org.opencontainers.image.authors=miroslav.smatana1@gmail.com
LABEL org.opencontainers.image.title="Node.js startet"
LABEL org.opencontainers.image.licenses=MIT
LABEL com.bretfisher.nodeversion=$NODE_VERSION

# Add Tini
ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

EXPOSE 5000

ENV NODE_ENV=production

WORKDIR /opt

COPY package*.json ./

# we use npm ci here so only the package-lock.json file is used
RUN npm config list \
    && npm ci \
    && npm cache clean --force

## Stage 2 (development)
# we don't COPY in this stage because for dev you'll bind-mount anyway
# this saves time when building locally for dev via docker-compose
FROM base as dev

ENV NODE_ENV=development

ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt

RUN npm install --only=development

WORKDIR /opt/app
USER node
ENTRYPOINT ["/tini", "--"]
CMD ["nodemon", "index.js", "--inspect=0.0.0.0:9229 --ignore tests"]


## Stage 3 (copy in source)
# This gets our source code into builder for use in next two stages
# It gets its own stage so we don't have to copy twice
# this stage starts from the first one and skips the last two
FROM base as source

WORKDIR /opt/app

COPY . .


## Stage 4 (testing)
# use this in automated CI
# it has prod and dev npm dependencies
# In 18.09 or older builder, this will always run
# In BuildKit, this will be skipped by default 
FROM source as test

ENV NODE_ENV=test
ENV PATH=/opt/node_modules/.bin:$PATH

# this copies all dependencies (prod+dev)
COPY --from=dev /opt/node_modules /opt/node_modules

# run unit tests as part of build
RUN npm test

# run tests with docker-compose later
ENTRYPOINT ["/tini", "--"]
CMD ["npm", "run", "test"] 


## Stage 5 (security scanning and audit)
FROM test as audit

RUN npm audit

# aqua microscanner, which needs a token for API access
# note this isn't super secret, so we'll use an ARG here
# https://github.com/aquasecurity/microscanner

#ARG MICROSCANNER_TOKEN
#ADD https://get.aquasec.com/microscanner /
#RUN chmod +x /microscanner
#RUN apk add --no-cache ca-certificates && update-ca-certificates
#RUN /microscanner $MICROSCANNER_TOKEN --continue-on-failure


## Stage 6 (default, production)
# this will run by default if you don't include a target
# it has prod-only dependencies
# In BuildKit, this is skipped for dev and test stages
FROM source as prod

HEALTHCHECK --interval=5s --timeout=3s --start-period=15s \
  CMD curl -f http://127.0.0.1/healthcheck || exit 1
USER node
ENTRYPOINT ["/tini", "--"]
CMD ["node", "index.js"]
