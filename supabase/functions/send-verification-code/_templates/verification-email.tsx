import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface VerificationEmailProps {
  verificationLink: string;
  email: string;
}

export const VerificationEmail = ({
  verificationLink,
  email,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Link your email to ChatLearn</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Link Your Email Address</Heading>
        
        <Text style={text}>Hi there,</Text>
        
        <Text style={text}>
          Click the button below to link {email} to your ChatLearn account:
        </Text>

        <Link
          href={verificationLink}
          target="_blank"
          style={button}
        >
          Verify Email Address
        </Link>

        <Text style={text}>
          This link will expire in 30 minutes.
        </Text>

        <Text style={text}>
          Or copy and paste this URL into your browser:
        </Text>
        
        <Text style={linkText}>{verificationLink}</Text>

        <Text style={warningText}>
          If you did not request to link an email address, you can safely ignore this message.
        </Text>

        <Text style={text}>Best,</Text>
        <Text style={text}>The ChatLearn Team</Text>

        <Text style={footer}>
          © 2025 ChatLearn. All rights reserved.
        </Text>
        <Text style={footer}>
          If you have any questions, contact us at support@chatl.ai
        </Text>
        <Text style={footer}>
          <Link
            href="https://www.chatl.ai/privacy"
            target="_blank"
            style={footerLink}
          >
            Privacy Policy
          </Link>
          {' | '}
          <Link
            href="https://www.chatl.ai/terms"
            target="_blank"
            style={footerLink}
          >
            Terms of Service
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '40px 0',
  padding: '0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
  padding: '0 20px',
};

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '280px',
  margin: '32px auto',
};

const linkText = {
  color: '#8B5CF6',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 24px',
  padding: '0 20px',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
};

const warningText = {
  color: '#666',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '24px 0 16px',
  padding: '0 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 0',
  padding: '0 20px',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};
