#!/usr/bin/env node

// Test script for both SES v1 and v2 endpoints
console.log('Testing SES v1 and v2 endpoints...\n');

const baseUrl = 'http://localhost:8282';

// Test SES v1 endpoint
async function testSESv1() {
  console.log('🔍 Testing SES v1 (form-encoded)...');
  
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
      console.log('✅ SES v1 test passed');
      console.log('Response:', result.substring(0, 200) + '...\n');
    } else {
      console.log('❌ SES v1 test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ SES v1 test error:', error.message);
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
  await testSESv2();
  
  console.log('\n🔗 View trapped emails at: http://localhost:8282/logs');
}

runTests();
