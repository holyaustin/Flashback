import type { NextApiRequest, NextApiResponse } from 'next';
import {Poll} from "@/app/types";
import {kv} from "@vercel/kv";
import {getSSLHubRpcClient, Message} from "@farcaster/hub-nodejs";

const HUB_URL = process.env['HUB_URL'] || "nemes.farcaster.xyz:2283"
const client = getSSLHubRpcClient(HUB_URL);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Process the vote
        // For example, let's assume you receive an option in the body
        try {
            const pollId = req.query['id']
            const results = req.query['results'] === 'true'
            let voted = req.query['voted'] === 'true'
            if (!pollId) {
                return res.status(400).send('Missing poll ID');
            }

            let validatedMessage : Message | undefined = undefined;
            try {
                const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'));
                const result = await client.validateMessage(frameMessage);
                if (result.isOk() && result.value.valid) {
                    validatedMessage = result.value.message;
                }
            } catch (e)  {
                return res.status(400).send(`Failed to validate message: ${e}`);
            }

            // const buttonId = validatedMessage?.data?.frameActionBody?.buttonIndex || 0;
            // const fid = validatedMessage?.data?.fid || 0;

            // Use untrusted data for testing
            const buttonId = req.body?.untrustedData?.buttonIndex || 0;
            const fid = req.body?.untrustedData?.fid || 0;

            const voteExists = await kv.sismember(`poll:${pollId}:voted`, fid)
            voted = voted || !!voteExists

            // Clicked create poll
            if ((voted || results) && buttonId === 2) {
                return res.status(302).setHeader('Location', `${process.env['HOST']}`).send('Redirecting to create poll');
            }

            if (fid > 0 && buttonId > 0 && buttonId < 5 && !results && !voted) {
                let multi = kv.multi();
                multi.hincrby(`poll:${pollId}`, `votes${buttonId}`, 1);
                multi.sadd(`poll:${pollId}:voted`, fid);
                await multi.exec();
            }

            let poll: Poll | null = await kv.hgetall(`poll:${pollId}`);

            if (!poll) {
                return res.status(400).send('Missing poll ID');
            }
            const imageUrl = `${process.env['HOST']}/api/image?id=${poll.id}&results=${results ? 'false': 'true'}&date=${Date.now()}${ fid > 0 ? `&fid=${fid}` : '' }`;
            let button1Text = "View Results";
            if (!voted && !results) {
                button1Text = "Back"
            } else if (voted && !results) {
                button1Text = "Already Voted"
            } else if (voted && results) {
                button1Text = "View Results"
            }

            // Return an HTML response
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Answer Noted</title>
          <meta property="of:accepts:xmtp" content="2024-02-01" />
          <meta property="og:title" content="Answer Noted">
          <meta property="og:image" content="${imageUrl}">
          <meta name="fc:frame" content="vNext">
          <meta name="fc:frame:image" content="${imageUrl}">
          <meta name="fc:frame:post_url" content="${process.env['HOST']}/api/vote?id=${poll.id}&voted=true&results=${results ? 'false' : 'true'}">
          <meta name="fc:frame:button:1" content="${button1Text}">
          <meta name="fc:frame:button:2" content="Create your poll">
          <meta name="fc:frame:button:2:action" content="post_redirect">
        </head>
        <body style="background-color:powderblue;">
          <p>${ results || voted ? `You have already selected an answer. You clicked ${buttonId}` : `Your selection for ${buttonId} has been noted for fid ${fid}.` }</p>
        </body>
      </html>
    `);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating image');
        }
    } else {
        // Handle any non-POST requests
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
