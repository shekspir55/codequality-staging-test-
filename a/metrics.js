/**
 * Application metrics collection
 */

class Metrics {
    constructor() {
        this.counters = new Map();
        this.gauges = new Map();
        this.histograms = new Map();
        this.startTime = Date.now();
    }

    // Counter operations
    incrementCounter(name, value = 1, labels = {}) {
        const key = this.buildKey(name, labels);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + value);
    }

    getCounter(name, labels = {}) {
        const key = this.buildKey(name, labels);
        return this.counters.get(key) || 0;
    }

    // Gauge operations
    setGauge(name, value, labels = {}) {
        const key = this.buildKey(name, labels);
        this.gauges.set(key, value);
    }

    getGauge(name, labels = {}) {
        const key = this.buildKey(name, labels);
        return this.gauges.get(key);
    }

    // Histogram operations
    recordHistogram(name, value, labels = {}) {
        const key = this.buildKey(name, labels);
        if (!this.histograms.has(key)) {
            this.histograms.set(key, []);
        }
        this.histograms.get(key).push(value);
    }

    getHistogramStats(name, labels = {}) {
        const key = this.buildKey(name, labels);
        const values = this.histograms.get(key) || [];

        if (values.length === 0) {
            return null;
        }

        const sorted = [...values].sort((a, b) => a - b);
        return {
            count: values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: values.reduce((a, b) => a + b, 0) / values.length,
            p50: this.percentile(sorted, 50),
            p95: this.percentile(sorted, 95),
            p99: this.percentile(sorted, 99)
        };
    }

    percentile(sorted, p) {
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    buildKey(name, labels) {
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
        return labelStr ? `${name}{${labelStr}}` : name;
    }

    // Common metrics
    trackRequest(method, path, statusCode, duration) {
        this.incrementCounter('http_requests_total', 1, { method, path, status: statusCode });
        this.recordHistogram('http_request_duration_ms', duration, { method, path });
    }

    trackError(type, message) {
        this.incrementCounter('errors_total', 1, { type });
    }

    trackUserAction(action, userId) {
        this.incrementCounter('user_actions_total', 1, { action });
    }

    // Export metrics
    getAll() {
        return {
            uptime: Date.now() - this.startTime,
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges),
            histograms: Object.fromEntries(
                Array.from(this.histograms.entries()).map(([k, v]) => [k, this.getHistogramStats(k)])
            )
        };
    }

    reset() {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
    }
}

const metrics = new Metrics();

module.exports = { Metrics, metrics };
