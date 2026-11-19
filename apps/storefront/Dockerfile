# Self-hosted alternative to Vercel: Node server output of Nuxt (Nitro).
# Build from the monorepo root:  docker build -f apps/storefront/Dockerfile -t vovian-storefront .
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json .npmrc ./
COPY packages ./packages
COPY apps/storefront ./apps/storefront
RUN npm ci --workspace @vovian/storefront --include-workspace-root
ARG NUXT_PUBLIC_SITE_URL
ENV NUXT_PUBLIC_SITE_URL=$NUXT_PUBLIC_SITE_URL
RUN npm run build -w @vovian/storefront

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /repo/apps/storefront/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
