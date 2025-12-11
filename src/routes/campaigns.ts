import { Env, APIResponse, Campaign } from '../types';
import { jsonResponse, errorResponse, generateId } from '../lib/utils';
import { sendEmail } from '../lib/email';

// GET /api/admin/campaigns
async function getCampaigns(request: Request, env: Env): Promise<Response> {
    try {
        const { results } = await env.DB.prepare(
            'SELECT * FROM campaigns ORDER BY created_at DESC'
        ).all<Campaign>();

        return jsonResponse<Campaign[]>(results || [], 200, env);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return errorResponse('Failed to fetch campaigns', 500, env);
    }
}

// POST /api/admin/campaigns
async function createCampaign(request: Request, env: Env): Promise<Response> {
    try {
        const { subject, preview_text, content } = await request.json() as any;

        if (!subject || !content) {
            return errorResponse('Subject and content are required', 400, env);
        }

        const id = generateId();
        const now = new Date().toISOString();

        await env.DB.prepare(
            `INSERT INTO campaigns (id, subject, preview_text, content, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'draft', ?, ?)`
        ).bind(id, subject, preview_text || null, content, now, now).run();

        const campaign: Campaign = {
            id,
            subject,
            preview_text: preview_text || undefined,
            content,
            status: 'draft',
            total_recipients: 0,
            successful_sends: 0,
            failed_sends: 0,
            created_at: now,
            updated_at: now
        };

        return jsonResponse<Campaign>(campaign, 201, env);
    } catch (error) {
        console.error('Error creating campaign:', error);
        return errorResponse('Failed to create campaign', 500, env);
    }
}

// PUT /api/admin/campaigns/:id
async function updateCampaign(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop()!; // Assumes clean URL handling in index.ts or simple split

        const { subject, preview_text, content } = await request.json() as any;
        const now = new Date().toISOString();

        // Check if campaign exists and is draft
        const existing = await env.DB.prepare(
            'SELECT * FROM campaigns WHERE id = ?'
        ).bind(id).first<Campaign>();

        if (!existing) {
            return errorResponse('Campaign not found', 404, env);
        }

        if (existing.status !== 'draft') {
            return errorResponse('Only draft campaigns can be edited', 400, env);
        }

        await env.DB.prepare(
            `UPDATE campaigns 
             SET subject = ?, preview_text = ?, content = ?, updated_at = ?
             WHERE id = ?`
        ).bind(
            subject || existing.subject,
            preview_text !== undefined ? preview_text : existing.preview_text,
            content || existing.content,
            now,
            id
        ).run();

        return jsonResponse({ success: true }, 200, env);
    } catch (error) {
        console.error('Error updating campaign:', error);
        return errorResponse('Failed to update campaign', 500, env);
    }
}

// DELETE /api/admin/campaigns/:id
async function deleteCampaign(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop()!;

        await env.DB.prepare(
            'DELETE FROM campaigns WHERE id = ?'
        ).bind(id).run();

        return jsonResponse({ success: true }, 200, env);
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return errorResponse('Failed to delete campaign', 500, env);
    }
}

// POST /api/admin/campaigns/:id/send-test
async function sendTestCampaign(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop()!;
        
        // Get all admin emails
        const { results: adminUsers } = await env.DB.prepare(
            'SELECT email FROM admin_users'
        ).all<{ email: string }>();
        
        const adminEmails = adminUsers.map(user => user.email);
        
        if (!adminEmails.length) {
            return errorResponse('No admin users found', 400, env);
        }

        // Get campaign details
        const campaign = await env.DB.prepare(
            'SELECT * FROM campaigns WHERE id = ?'
        ).bind(id).first<Campaign>();

        if (!campaign) {
            return errorResponse('Campaign not found', 404, env);
        }

        // Send test emails to all admin users
        const results = await Promise.allSettled(
            adminEmails.map(email => 
                sendEmail({
                    to: email,
                    subject: `[TEST] ${campaign.subject}`,
                    html: campaign.content,
                    text: campaign.preview_text || campaign.subject,
                }, env)
            )
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.length - successCount;

        return jsonResponse({
            success: true,
            message: `Test email sent to ${successCount} recipients. ${failCount} failed.`,
            sent: successCount,
            failed: failCount
        }, 200, env);

    } catch (error) {
        console.error('Error sending test campaign:', error);
        return errorResponse('Failed to send test campaign', 500, env);
    }
}

// POST /api/admin/campaigns/:id/send
async function sendCampaign(request: Request, env: Env): Promise<Response> {
    // Extract ID from URL first so it's available in the catch block
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 2];
    
    try {

        // Check for test email in body
        let testEmail: string | undefined;
        try {
            const body = await request.clone().json() as any;
            testEmail = body.testEmail;
        } catch (e) {
            // No body or invalid json, ignore
        }

        const campaign = await env.DB.prepare(
            'SELECT * FROM campaigns WHERE id = ?'
        ).bind(id).first<Campaign>();

        if (!campaign) {
            return errorResponse('Campaign not found', 404, env);
        }

        if (testEmail) {
            const result = await sendEmail({
                to: testEmail,
                subject: `[TEST] ${campaign.subject}`,
                html: campaign.content,
                text: 'View this email in your browser.'
            }, env);

            if (result.success) {
                return jsonResponse({ success: true, message: `Test email sent to ${testEmail}` }, 200, env);
            } else {
                return errorResponse(`Failed to send test email: ${result.error}`, 500, env);
            }
        }

        if (campaign.status !== 'draft' && campaign.status !== 'failed') {
            return errorResponse('Campaign is not in a state to be sent', 400, env);
        }

        // Get all subscribers for this campaign
        const { results: subscribers } = await env.DB.prepare(
            'SELECT email FROM subscribers WHERE subscribed = ?'
        ).bind(1).all<{ email: string }>();

        if (!subscribers?.length) {
            return errorResponse('No active subscribers found', 400, env);
        }

        // If test email is provided, only send to that email
        const recipients = testEmail ? [{ email: testEmail }] : subscribers;
        let successCount = 0;
        let failCount = 0;

        // Update campaign status to 'sending'
        await env.DB.prepare(
            "UPDATE campaigns SET status = 'sending', updated_at = ? WHERE id = ?"
        ).bind(new Date().toISOString(), id).run();

        // Process emails in batches of 3
        const BATCH_SIZE = 3;
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            const batch = recipients.slice(i, i + BATCH_SIZE);
            
            // Process current batch in parallel
            const batchResults = await Promise.allSettled(
                batch.map(async (sub) => {
                    try {
                        const result = await sendEmail({
                            to: sub.email,
                            subject: campaign.subject,
                            html: campaign.content,
                            text: campaign.preview_text || campaign.subject,
                        }, env);
                        return { success: result.success, email: sub.email, error: result.error };
                    } catch (error) {
                        return { success: false, email: sub.email, error: error instanceof Error ? error.message : String(error) };
                    }
                })
            );

            // Update counters
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    const { success, error, email } = result.value;
                    if (success) {
                        successCount++;
                    } else {
                        failCount++;
                        console.error(`Failed to send to ${email}:`, error);
                    }
                } else {
                    failCount++;
                    console.error('Error processing batch item:', result.reason);
                }
            }

            // Small delay between batches to prevent rate limiting
            if (i + BATCH_SIZE < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Update final status
        const finalStatus = failCount === subscribers.length ? 'failed' : 'sent';
        await env.DB.prepare(
            "UPDATE campaigns SET status = ?, successful_sends = ?, failed_sends = ?, updated_at = ? WHERE id = ?"
        ).bind(finalStatus, successCount, failCount, new Date().toISOString(), id).run();

        return jsonResponse({
            success: true,
            message: `Campaign sent: ${successCount} successful, ${failCount} failed`,
            sent: successCount,
            failed: failCount
        }, 200, env);
    } catch (error) {
        console.error('Error sending campaign:', error);
        // Get the ID from the URL if we need to update the status
        let campaignId = id;
        if (!campaignId) {
            const url = new URL(request.url);
            const parts = url.pathname.split('/');
            campaignId = parts[parts.length - 2];
        }
        
        if (campaignId) {
            await env.DB.prepare(
                "UPDATE campaigns SET status = 'failed', updated_at = ? WHERE id = ?"
            ).bind(new Date().toISOString(), campaignId).run();
        }
        
        return errorResponse('Failed to send campaign', 500, env);
    }
}

// Export all functions
export {
    getCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    sendTestCampaign
};
