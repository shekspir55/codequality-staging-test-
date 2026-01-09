/**
 * Email service for sending transactional emails
 */

class EmailService {
    constructor(options = {}) {
        this.from = options.from || 'noreply@example.com';
        this.templates = new Map();
        this.queue = [];
    }

    registerTemplate(name, template) {
        this.templates.set(name, template);
    }

    async send(to, subject, body) {
        const email = {
            from: this.from,
            to,
            subject,
            body,
            timestamp: new Date().toISOString()
        };

        // FIXME: Implement actual email sending
        console.log('Sending email:', email);
        this.queue.push(email);
        return { success: true, messageId: `msg_${Date.now()}` };
    }

    async sendTemplate(to, templateName, data) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template "${templateName}" not found`);
        }

        const subject = this.interpolate(template.subject, data);
        const body = this.interpolate(template.body, data);

        return this.send(to, subject, body);
    }

    interpolate(text, data) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    async sendWelcomeEmail(user) {
        return this.send(
            user.email,
            'Welcome to Our Platform',
            `Hi ${user.name},\n\nWelcome to our platform! Your account has been created successfully.`
        );
    }

    async sendPasswordResetEmail(user, resetToken) {
        const resetLink = `https://example.com/reset-password?token=${resetToken}`;
        return this.send(
            user.email,
            'Password Reset Request',
            `Hi ${user.name},\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.`
        );
    }

    getQueueLength() {
        return this.queue.length;
    }

    clearQueue() {
        this.queue = [];
    }
}

const emailService = new EmailService();

module.exports = { EmailService, emailService };
