import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

/**
 * Phase 6 observability — distributed tracing.
 *
 * Must be the very first thing `index.ts` imports (before `./app` or any other
 * module). This file's module-level code runs synchronously to completion — including
 * `sdk.start()`, which monkey-patches `http`/`express`/etc. via require-in-the-middle —
 * before Node moves on to `require`-ing anything else, so every later `require('http')`
 * (transitively, via express/http-proxy-middleware) gets the instrumented version.
 * That ordering guarantee is exactly why no `--require` CLI flag is needed here despite
 * that being OpenTelemetry's more commonly documented setup.
 *
 * Reads `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_SERVICE_NAME` from the environment (set
 * in docker-compose.yml). If Tempo isn't reachable, exports fail silently in the
 * background — no impact on the gateway itself.
 *
 * Auto-instrumentation propagates the W3C `traceparent` header on every proxied HTTP
 * call, so a trace started here continues into whichever Spring service the request
 * reaches (each running the OTel Java agent — see the Dockerfiles) with correct
 * parent/child span relationships, no manual header plumbing required.
 */
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Skip noisy low-value spans (Express request logger already covers HTTP,
      // and fs instrumentation is chatty and adds little insight in this app).
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
