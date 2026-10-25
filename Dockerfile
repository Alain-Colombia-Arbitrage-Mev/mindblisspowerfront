# syntax=docker/dockerfile:1.7
FROM node:24.16.0-bookworm-slim@sha256:2c87ef9bd3c6a3bd4b472b4bec2ce9d16354b0c574f736c476489d09f560a203 AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=mindbliss-client-npm,target=/root/.npm,sharing=locked \
    npm ci --ignore-scripts --no-audit --no-fund

FROM dependencies AS source
COPY src ./src
COPY public ./public
COPY infra ./infra
COPY next.config.mjs postcss.config.js tailwind.config.js jsconfig.json eslint.config.js ./

FROM source AS test
CMD ["sh", "-c", "npm run typecheck && npm test"]

FROM source AS builder
RUN --mount=type=cache,id=mindbliss-client-next,target=/app/.next/cache,sharing=locked \
    npm run typecheck && npm run build

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:cb606325b7ec4af55462cb0b424a53b452a5b4a894ffe841fcf1048d216fb9f8 AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=builder --chown=65532:65532 /app/public ./public
USER 65532:65532
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/health',{signal:AbortSignal.timeout(2000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
ENTRYPOINT ["/nodejs/bin/node"]
CMD ["server.js"]
