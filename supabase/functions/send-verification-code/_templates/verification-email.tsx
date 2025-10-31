import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
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
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Link your email to ChatLearn</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoSection}>
            <Img
              src="https://www.chatl.ai/favicon.png"
              alt="ChatLearn Logo"
              width="120"
              height="auto"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Heading style={h1}>Link Your Email Address</Heading>
          
          <Text style={text}>
            Hi there,
          </Text>
          
          <Text style={text}>
            Click the button below to link <strong>{email}</strong> to your ChatLearn account:
          </Text>

          <Section style={buttonSection}>
            <Link href={verificationLink} style={button}>
              Verify Email Address
            </Link>
          </Section>

          <Text style={text}>
            This link will expire in <strong>30 minutes</strong>.
          </Text>

          <Text style={orText}>
            Or copy and paste this URL into your browser:
          </Text>
          
          <Text style={linkText}>
            {verificationLink}
          </Text>

          <Text style={warningText}>
            If you didn't request to link an email address, you can safely ignore this message.
          </Text>

          <Text style={text}>
            Best,
          </Text>
          <Text style={text}>
            The ChatLearn Team
          </Text>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2025 ChatLearn. All rights reserved.
            </Text>
            <Text style={footerText}>
              If you have any questions, contact us at support@chatl.ai
            </Text>
            <Link href="https://www.chatl.ai/privacy" style={footerLink}>
              Privacy Policy
            </Link>
            <Text style={{ ...footerText, display: 'inline', margin: '0 8px' }}>
              •
            </Text>
            <Link href="https://www.chatl.ai/terms" style={footerLink}>
              Terms of Service
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

// Styles
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

const logoSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px',
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

const buttonSection = {
  padding: '32px 20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '280px',
  padding: '0 20px',
};

const orText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 8px',
  padding: '0 20px',
  textAlign: 'center' as const,
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
  borderTop: '1px solid #e6ebf1',
  marginTop: '48px',
  padding: '20px 20px 0',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const footerLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};
