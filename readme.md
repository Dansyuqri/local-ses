# local-ses

> Trap and test AWS SES emails locally

![local-ses](./.github/email-demo.png)

## Setup

You can simply use `docker` to run the service locally

```bash
docker run -d --name local-ses -p 8282:8282 dansyuqri/local-ses:latest
```

This will start the service on port `8282`. Next, modify your SES client to use the local service. 

For example, if you are using `aws-sdk` you can do something like

```javascript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const client = new SESClient({
  region: credentials.region,
  credentials: {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  },
  endpoint: "http://localhost:8282", // <--- Add this to trap emails locally
});

// Send emails as usual
const command = new SendEmailCommand({/*...*/});
const result = await sesClient.send(command);

logInfo(`Email sent to ${toAddress} with message ID ${result.MessageId}`);
```

## License

MIT © [Syuqri](https://github.com/Dansyuqri)

## Acknowledgments
This repo is a fork from [Kamran Ahmed's local-ses](https://github.com/kamranahmedse/local-ses)
It was forked with the main purpose of adding missing functionality, without the overhead of approvals.

## Contributions
Open to contributions!
