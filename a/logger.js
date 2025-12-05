const util = require('util');
const fs = require('fs');
const path = require('path');

const LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const LogLevelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

class Logger {
    constructor(options = {}) {
        this.name = options.name || 'app';
        this.level = options.level !== undefined ? options.level : LogLevel.INFO;
        this.formatter = options.formatter || this.defaultFormatter.bind(this);
        this.transports = options.transports || [new ConsoleTransport()];
        this.context = options.context || {};
    }

    defaultFormatter(level, message, meta) {
        const timestamp = new Date().toISOString();
        const levelName = LogLevelNames[level] || 'UNKNOWN';
        const contextStr = Object.keys(this.context).length > 0
            ? ` ${JSON.stringify(this.context)}`
            : '';

        let metaStr = '';
        if (meta && Object.keys(meta).length > 0) {
            metaStr = ` ${util.inspect(meta, { depth: 3, colors: false })}`;
        }

        return `[${timestamp}] [${levelName}] [${this.name}]${contextStr} ${message}${metaStr}`;
    }

    log(level, message, meta = {}) {
        if (level > this.level) {
            return;
        }

        const formattedMessage = this.formatter(level, message, meta);

        for (const transport of this.transports) {
            transport.write(level, formattedMessage, { message, meta, logger: this });
        }
    }

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


    child(context) {
        return new Logger({
            name: this.name,
            level: this.level,
            formatter: this.formatter,
            transports: this.transports,
            context: { ...this.context, ...context }
        });
    }

    setLevel(level) {
        this.level = level;
    }

}

class ConsoleTransport {
    write(level, formattedMessage) {
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

class FileTransport {
    constructor(options = {}) {
        this.filename = options.filename || 'app.log';
        this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
        this.maxFiles = options.maxFiles || 5;
        this.stream = null;
        this.currentSize = 0;

        this.initStream();
    }

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

        this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
    }

    write(level, formattedMessage) {
        const line = formattedMessage + '\n';
        const lineSize = Buffer.byteLength(line);

        if (this.currentSize + lineSize > this.maxSize) {
            this.rotate();
        }

        this.stream.write(line);
        this.currentSize += lineSize;
    }

    rotate() {
        this.stream.end();

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
        this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
    }

    close() {
        if (this.stream) {
            this.stream.end();
        }
    }
}

function createLogger(name, options = {}) {
    return new Logger({ name, ...options });
}

const defaultLogger = new Logger();


module.exports = {
    Logger,
    LogLevel,
    ConsoleTransport,
    FileTransport,
    createLogger,
    defaultLogger
};
