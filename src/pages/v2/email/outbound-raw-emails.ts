import { type APIRoute } from "astro";
import { emails, type EmailType } from "../../index.ts";

// Helper function to parse raw email message (similar to v1 implementation)
function parseRawEmailMessage(rawMessage: string, fromAddress?: string, destinations?: string[]): {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
} {
  // Decode base64 if the message is base64 encoded
  let decodedMessage = rawMessage;
  try {
    // Try to decode from base64
    decodedMessage = atob(rawMessage);
  } catch (e) {
    // If it fails, assume it's already plain text
    decodedMessage = rawMessage;
  }

  // Parse email headers and body
  const lines = decodedMessage.split('\n');
  let headerEndIndex = -1;
  const headers: Record<string, string> = {};
  
  // Find headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      headerEndIndex = i;
      break;
    }
    
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const headerName = line.substring(0, colonIndex).toLowerCase().trim();
      const headerValue = line.substring(colonIndex + 1).trim();
      headers[headerName] = headerValue;
    }
  }

  // Extract subject from headers
  const subject = headers['subject'] || 'No Subject';
  
  // Extract from address (prefer header, fallback to fromAddress parameter)
  const from = headers['from'] || fromAddress || 'Unknown';
  
  // Use destinations from parameters, fallback to To header
  const to = destinations && destinations.length > 0 ? destinations.join(', ') : (headers['to'] || 'Unknown');

  // Get body content (everything after headers)
  const bodyLines = headerEndIndex >= 0 ? lines.slice(headerEndIndex + 1) : [];
  const bodyContent = bodyLines.join('\n');

  // Simple parsing - check if content contains HTML
  const hasHtml = bodyContent.includes('<html>') || bodyContent.includes('<HTML>') || 
                  bodyContent.includes('<body>') || bodyContent.includes('<BODY>') ||
                  bodyContent.includes('<p>') || bodyContent.includes('<div>');

  return {
    from,
    to,
    subject,
    text: hasHtml ? '' : bodyContent,
    html: hasHtml ? bodyContent : ''
  };
}

// SES v2 SendRawEmail API endpoint
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Extract email data from SES v2 SendRawEmail format
    const { RawMessage, FromEmailAddress, Destinations } = body;
    
    if (!RawMessage?.Data) {
      return new Response(
        JSON.stringify({
          __type: "BadRequestException",
          message: "Missing required parameter: RawMessage.Data"
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Parse the raw email message
    const emailData = parseRawEmailMessage(
      RawMessage.Data, 
      FromEmailAddress, 
      Destinations
    );

    // Create email object compatible with existing EmailType
    const email: EmailType = {
      id: emails.length + 1,
      messageId: `${Math.random().toString(36).substring(7)}-${Date.now()}@amazonses.com`,
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      date: new Date(),
      status: "delivery",
    };

    // Add to emails array
    emails.push(email);

    // Return SES v2 format response
    return new Response(
      JSON.stringify({
        MessageId: email.messageId
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("SES v2 SendRawEmail error:", error);
    return new Response(
      JSON.stringify({
        __type: "InternalFailureException",
        message: "Internal server error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
