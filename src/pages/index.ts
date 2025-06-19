import type { APIRoute } from "astro";
import type { AllowedActions } from "./hooks.ts";

export type EmailType = {
  id: number;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  messageId: string;
  status: AllowedActions;
};

export const emails: EmailType[] = [];

async function handleSendEmail(data: Record<string, any>) {
  const from = data.get("Source") || "";
  const toList = getToAddresses(data);
  const subject = data.get("Message.Subject.Data") || "";
  const text = data.get("Message.Body.Text.Data") || "";
  const html = data.get("Message.Body.Html.Data") || "";

  const messageId = new Date().getTime();
  const requestId = new Date().getTime() + Math.random() * 1000;

  const currentId = emails.length + 1;

  emails.push({
    id: currentId,
    from,
    to: toList.join(', ') ,
    subject,
    text,
    html,
    date: new Date(),
    messageId: `${messageId}`,
    status: 'delivery'
  });

  const sendEmailResponse = `
    <SendEmailResponse xmlns="https://ses.amazonaws.com/doc/2010-12-01/">
        <SendEmailResult>
            <MessageId>${messageId}</MessageId>
        </SendEmailResult>
        <ResponseMetadata>
            <RequestId>${requestId}</RequestId>
        </ResponseMetadata>
    </SendEmailResponse>
  `;

  return new Response(sendEmailResponse, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

async function handleSendRawEmail(data: Record<string, any>) {
  const rawMessage = data.get("RawMessage.Data") || "";
  const source = data.get("Source") || "";
  const destinations = getRawEmailDestinations(data);

  // Parse the raw email message
  const emailData = parseRawEmailMessage(rawMessage, source, destinations);

  const messageId = new Date().getTime();
  const requestId = new Date().getTime() + Math.random() * 1000;

  const currentId = emails.length + 1;

  emails.push({
    id: currentId,
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
    date: new Date(),
    messageId: `${messageId}`,
    status: 'delivery'
  });

  const sendRawEmailResponse = `
    <SendRawEmailResponse xmlns="https://ses.amazonaws.com/doc/2010-12-01/">
        <SendRawEmailResult>
            <MessageId>${messageId}</MessageId>
        </SendRawEmailResult>
        <ResponseMetadata>
            <RequestId>${requestId}</RequestId>
        </ResponseMetadata>
    </SendRawEmailResponse>
  `;

  return new Response(sendRawEmailResponse, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

function getToAddresses(data: Record<string, any>): string[] {
    let memberCount = 1;
    const addresses: string[] = [];
    while (data.get(`Destination.ToAddresses.member.${memberCount}`)) {
      const address = data.get(`Destination.ToAddresses.member.${memberCount}`);
      addresses.push(address);
      memberCount++;
    }
    return addresses;
  }

function getRawEmailDestinations(data: Record<string, any>): string[] {
  let memberCount = 1;
  const addresses: string[] = [];
  while (data.get(`Destinations.member.${memberCount}`)) {
    const address = data.get(`Destinations.member.${memberCount}`);
    addresses.push(address);
    memberCount++;
  }
  return addresses;
}

function parseRawEmailMessage(rawMessage: string, source: string, destinations: string[]): {
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
  
  // Extract from address (prefer header, fallback to source parameter)
  const from = headers['from'] || source || 'Unknown';
  
  // Use destinations from parameters, fallback to To header
  const to = destinations.length > 0 ? destinations.join(', ') : (headers['to'] || 'Unknown');

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

async function handleGetQuota() {
  const quotaResponse = `
    <GetSendQuotaResponse xmlns="https://ses.amazonaws.com/doc/2010-12-01/">
      <GetSendQuotaResult>
        <SentLast24Hours>0</SentLast24Hours>
        <Max24HourSend>50000.0</Max24HourSend>
        <MaxSendRate>200.0</MaxSendRate>
      </GetSendQuotaResult>
      <ResponseMetadata>
        <RequestId>${new Date().getTime()}</RequestId>
      </ResponseMetadata>
    </GetSendQuotaResponse>
  `;

  return new Response(quotaResponse, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  return Response.redirect(`${request.url}logs`);
};

export const POST: APIRoute = async ({ params, request }) => {
  const body = await request.text();
  const data = new URLSearchParams(body);

  const action = data.get("Action")!;
  if (!action) {
    return new Response("Action not found", { status: 400 });
  }

  // if it is quota request, return a quota response
  if (action === "GetSendQuota") {
    return handleGetQuota();
  } else if (action === "SendEmail") {
    return handleSendEmail(data);
  } else if (action === "SendRawEmail") {
    return handleSendRawEmail(data);
  }

  return new Response(`Unsupported action: ${action}`, {
    status: 400,
  });
};
