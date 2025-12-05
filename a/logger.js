const util = require('util');
const fs = require('fs');
const path = require('path');

// TODO: Add TRACE level for very verbose debugging
// TODO: Add FATAL level for critical errors
const LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// FIXME: Should be an object for O(1) lookup instead of array
const LogLevelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

// TODO: Add singleton pattern option for global logger
// TODO: Add support for log sampling in high-throughput scenarios
class Logger {
    constructor(options = {}) {
        this.name = options.name || 'app';
        // TODO: Support string log levels ('info', 'debug', etc.)
        this.level = options.level !== undefined ? options.level : LogLevel.INFO;
        this.formatter = options.formatter || this.defaultFormatter.bind(this);
        this.transports = options.transports || [new ConsoleTransport()];
        this.context = options.context || {};
        // TODO: Add request ID tracking for distributed tracing
    }

    // TODO: Add JSON formatter option for structured logging
    // TODO: Add support for custom timestamp formats
    defaultFormatter(level, message, meta) {
        const timestamp = new Date().toISOString();
        const levelName = LogLevelNames[level] || 'UNKNOWN';
        // FIXME: JSON.stringify can throw on circular references
        const contextStr = Object.keys(this.context).length > 0
            ? ` ${JSON.stringify(this.context)}`
            : '';

        let metaStr = '';
        if (meta && Object.keys(meta).length > 0) {
            // TODO: Add option to redact sensitive fields (password, token, etc.)
            metaStr = ` ${util.inspect(meta, { depth: 3, colors: false })}`;
        }

        // TODO: Add hostname and PID for multi-instance deployments
        return `[${timestamp}] [${levelName}] [${this.name}]${contextStr} ${message}${metaStr}`;
    }

    // TODO: Add async logging option for better performance
    log(level, message, meta = {}) {
        if (level > this.level) {
            return;
        }

        const formattedMessage = this.formatter(level, message, meta);

        // FIXME: Transport errors should not crash the application
        // TODO: Add buffering for batch writes
        for (const transport of this.transports) {
            transport.write(level, formattedMessage, { message, meta, logger: this });
        }
    }

    // TODO: Add error stack trace formatting
    error(message, meta) {
        this.log(LogLevel.ERROR, message, meta);
    }

    warn(message, meta) {
        this.log(LogLevel.WARN, message, meta);
    }

    info(message, meta) {
        this.log(LogLevel.INFO, message, meta);
    }

    debug(message, meta) {
        this.log(LogLevel.DEBUG, message, meta);
    }

    // TODO: Add trace(message, meta) method
    // TODO: Add fatal(message, meta) method that also triggers alerts

    // TODO: Add option to inherit parent's name with suffix (e.g., 'app:auth')
    child(context) {
        return new Logger({
            name: this.name,
            level: this.level,
            formatter: this.formatter,
            transports: this.transports,
            context: { ...this.context, ...context }
        });
    }

    // TODO: Add runtime level change via environment variable
    setLevel(level) {
        this.level = level;
    }

    // TODO: Add flush() method to ensure all logs are written
    // TODO: Add close() method to properly shutdown transports
}

// TODO: Add color support for terminal output
// TODO: Add option to output to stderr for all levels
class ConsoleTransport {
    write(level, formattedMessage) {
        // FIXME: Console methods are synchronous and can block
        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }
}

// TODO: Add compression support for rotated files
// TODO: Add date-based rotation option (daily, weekly)
class FileTransport {
    constructor(options = {}) {
        this.filename = options.filename || 'app.log';
        this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
        this.maxFiles = options.maxFiles || 5;
        this.stream = null;
        this.currentSize = 0;
        // TODO: Add file permissions option
        // TODO: Add option to create separate files per log level

        this.initStream();
    }

    // FIXME: Synchronous file operations can block event loop
    initStream() {
        const dir = path.dirname(this.filename);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        try {
            const stats = fs.statSync(this.filename);
            this.currentSize = stats.size;
        } catch {
            this.currentSize = 0;
        }

        // TODO: Add error handling for stream creation
        // TODO: Add 'drain' event handling for backpressure
        this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
    }

    // TODO: Add write buffering for better performance
    write(level, formattedMessage) {
        const line = formattedMessage + '\n';
        const lineSize = Buffer.byteLength(line);

        // FIXME: Race condition if multiple writes happen simultaneously
        if (this.currentSize + lineSize > this.maxSize) {
            this.rotate();
        }

        // TODO: Handle write errors gracefully
        this.stream.write(line);
        this.currentSize += lineSize;
    }

    // TODO: Add async rotation to avoid blocking
    // TODO: Add rotation callback/event for cleanup hooks
    rotate() {
        this.stream.end();

        // FIXME: This loop can be slow with many files - consider async
        for (let i = this.maxFiles - 1; i >= 1; i--) {
            const oldPath = `${this.filename}.${i}`;
            const newPath = `${this.filename}.${i + 1}`;
            if (fs.existsSync(oldPath)) {
                if (i === this.maxFiles - 1) {
                    fs.unlinkSync(oldPath);
                } else {
                    fs.renameSync(oldPath, newPath);
                }
            }
        }

        if (fs.existsSync(this.filename)) {
            fs.renameSync(this.filename, `${this.filename}.1`);
        }

        this.currentSize = 0;
        // TODO: Add gzip compression for rotated files
        this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
    }

    close() {
        if (this.stream) {
            this.stream.end();
        }
    }
}

// TODO: Add createRequestLogger for HTTP request logging
function createLogger(name, options = {}) {
    return new Logger({ name, ...options });
}

// TODO: Configure default logger from environment variables
const defaultLogger = new Logger();

// TODO: Add HttpTransport for remote logging services (Loggly, Papertrail)
// TODO: Add ElasticsearchTransport for ELK stack integration
// TODO: Add CloudWatchTransport for AWS logging

module.exports = {
    Logger,
    LogLevel,
    ConsoleTransport,
    FileTransport,
    createLogger,
    defaultLogger
    // TODO: Export LogLevelNames for external use
};
