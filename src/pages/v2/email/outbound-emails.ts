import { type APIRoute } from "astro";
import { emails, type EmailType } from "../../index.ts";

// SES v2 SendEmail API endpoint
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Extract email data from SES v2 format
    const { Destination, Content, FromEmailAddress } = body;
    
    if (!Destination?.ToAddresses?.[0] || !Content || !FromEmailAddress) {
      return new Response(
        JSON.stringify({
          __type: "BadRequestException",
          message: "Missing required parameters"
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Create email object compatible with existing EmailType
    const email: EmailType = {
      id: emails.length + 1,
      messageId: `${Math.random().toString(36).substring(7)}-${Date.now()}@amazonses.com`,
      to: Destination.ToAddresses.join(', '), // Convert array to string for storage
      from: FromEmailAddress,
      subject: Content.Simple?.Subject?.Data || Content.Template?.TemplateName || "No Subject",
      html: Content.Simple?.Body?.Html?.Data || Content.Template?.TemplateData || "",
      text: Content.Simple?.Body?.Text?.Data || "",
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
    console.error("SES v2 SendEmail error:", error);
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
