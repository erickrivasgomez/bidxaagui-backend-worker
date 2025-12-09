import { Env } from '../types';

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    text: string;
}

interface ResendResponse {
    id?: string;
    error?: {
        message: string;
    };
}

// Send email via Resend API
export async function sendEmail(
    params: SendEmailParams,
    env: Env
): Promise<{ success: boolean; error?: string }> {
    const { to, subject, html, text } = params;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `BIDXAAGUI <${env.RESEND_FROM_EMAIL}>`,
                to: [to],
                subject,
                html,
                text,
            }),
        });

        if (!response.ok) {
            const error = await response.json() as ResendResponse;
            console.error('Resend API error:', error);
            return {
                success: false,
                error: error.error?.message || 'Failed to send email',
            };
        }

        const data = await response.json() as ResendResponse;
        console.log('Email sent successfully:', data.id);

        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: 'Failed to send email due to network error',
        };
    }
}
