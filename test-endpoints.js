#!/usr/bin/env node

// Test script for both SES v1 and v2 endpoints
console.log('Testing SES v1 and v2 endpoints...\n');

const baseUrl = 'http://localhost:8282';

// Test SES v1 endpoint
async function testSESv1() {
  console.log('🔍 Testing SES v1 SendEmail (form-encoded)...');
  
  const sesv1Data = new URLSearchParams({
    'Action': 'SendEmail',
    'Source': 'sender@example.com',
    'Destination.ToAddresses.member.1': 'recipient1@example.com',
    'Destination.ToAddresses.member.2': 'recipient2@example.com',
    'Destination.ToAddresses.member.3': 'recipient3@example.com',
    'Message.Subject.Data': 'Test SES v1 Email',
    'Message.Body.Text.Data': 'This is a test email from SES v1',
    'Message.Body.Html.Data': '<h1>This is a test email from SES v1</h1>'
  });

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sesv1Data.toString()
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ SES v1 SendEmail test passed');
      console.log('Response:', result.substring(0, 200) + '...\n');
    } else {
      console.log('❌ SES v1 SendEmail test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ SES v1 SendEmail test error:', error.message);
  }
}

// Test SES v1 SendRawEmail endpoint
async function testSESv1SendRawEmail() {
  console.log('🔍 Testing SES v1 SendRawEmail (form-encoded)...');
  
  // Create a simple raw email message
  const rawEmailMessage = `From: sender@example.com
To: recipient1@example.com, recipient2@example.com
Subject: Test SES v1 Raw Email
Content-Type: text/html; charset=UTF-8

<html>
<body>
<h1>This is a test raw email from SES v1</h1>
<p>This email was sent using the SendRawEmail API.</p>
</body>
</html>`;

  // Base64 encode the raw message (optional but common)
  const base64Message = btoa(rawEmailMessage);
  
  const sesv1RawData = new URLSearchParams({
    'Action': 'SendRawEmail',
    'Source': 'sender@example.com',
    'Destinations.member.1': 'recipient1@example.com',
    'Destinations.member.2': 'recipient2@example.com',
    'RawMessage.Data': base64Message
  });

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sesv1RawData.toString()
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ SES v1 SendRawEmail test passed');
      console.log('Response:', result.substring(0, 200) + '...\n');
    } else {
      console.log('❌ SES v1 SendRawEmail test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ SES v1 SendRawEmail test error:', error.message);
  }
}

// Test SES v1 SendRawEmail with plain text (no base64)
async function testSESv1SendRawEmailPlainText() {
  console.log('🔍 Testing SES v1 SendRawEmail Plain Text...');
  
  // Create a simple plain text raw email message
  const rawEmailMessage = `From: sender@example.com
To: recipient3@example.com
Subject: Plain Text Raw Email Test
Content-Type: text/plain; charset=UTF-8

This is a plain text email sent using SendRawEmail without base64 encoding.
It should be parsed correctly by the local SES implementation.`;
  
  const sesv1RawData = new URLSearchParams({
    'Action': 'SendRawEmail',
    'Source': 'sender@example.com',
    'Destinations.member.1': 'recipient3@example.com',
    'RawMessage.Data': rawEmailMessage
  });

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sesv1RawData.toString()
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ SES v1 SendRawEmail Plain Text test passed');
      console.log('Response:', result.substring(0, 200) + '...\n');
    } else {
      console.log('❌ SES v1 SendRawEmail Plain Text test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ SES v1 SendRawEmail Plain Text test error:', error.message);
  }
}

// Test SES v1 SendRawEmail with attachments (example)
async function testSESv1SendRawEmailWithAttachment() {
  console.log('🔍 Testing SES v1 SendRawEmail with MIME attachment...');
  
  // Create a raw email message with attachment
  const boundary = '----=_Part_0_12345.67890';
  const rawEmailMessage = `From: sender@example.com
To: recipient4@example.com
Subject: Test Email with Attachment
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary}"

--${boundary}
Content-Type: text/html; charset=UTF-8

<html>
<body>
<h1>Email with Attachment</h1>
<p>This email demonstrates SendRawEmail with a file attachment.</p>
</body>
</html>

--${boundary}
Content-Type: text/plain; name="example.txt"
Content-Disposition: attachment; filename="example.txt"
Content-Transfer-Encoding: base64

VGhpcyBpcyBhIHNhbXBsZSB0ZXh0IGZpbGUgYXR0YWNobWVudC4=

--${boundary}--`;

  const sesv1RawData = new URLSearchParams({
    'Action': 'SendRawEmail',
    'Source': 'sender@example.com',
    'Destinations.member.1': 'recipient4@example.com',
    'RawMessage.Data': btoa(rawEmailMessage)
  });

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sesv1RawData.toString()
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ SES v1 SendRawEmail with attachment test passed');
      console.log('Response:', result.substring(0, 200) + '...\n');
    } else {
      console.log('❌ SES v1 SendRawEmail with attachment test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ SES v1 SendRawEmail with attachment test error:', error.message);
  }
}

// Test SES v2 endpoint
async function testSESv2() {
  console.log('🔍 Testing SES v2 (JSON)...');
  
  const sesv2Data = {
    FromEmailAddress: 'sender@example.com',
    Destination: {
      ToAddresses: ['recipient1@example.com', 'recipient2@example.com', 'recipient3@example.com']
    },
    Content: {
      Simple: {
        Subject: {
          Data: 'Test SES v2 Email',
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: 'This is a test email from SES v2',
            Charset: 'UTF-8'
          },
          Html: {
            Data: '<h1>This is a test email from SES v2</h1>',
            Charset: 'UTF-8'
          }
        }
      }
    }
  };

  try {
    const response = await fetch(`${baseUrl}/v2/email/outbound-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sesv2Data)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SES v2 test passed');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ SES v2 test failed:', response.status, response.statusText);
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ SES v2 test error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testSESv1();
  await testSESv1SendRawEmail();
  await testSESv1SendRawEmailPlainText();
  await testSESv1SendRawEmailWithAttachment();
  await testSESv2();
  
  console.log('\n🔗 View trapped emails at: http://localhost:8282/logs');
}

runTests();
