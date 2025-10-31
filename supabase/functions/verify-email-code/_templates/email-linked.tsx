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

interface EmailLinkedProps {
  email: string;
  userName?: string;
}

export const EmailLinkedEmail = ({
  email,
  userName,
}: EmailLinkedProps) => {
  const displayName = userName || email.split('@')[0];
  
  return (
    <Html>
      <Head />
      <Preview>Your email has been successfully linked to ChatLearn</Preview>
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
          <Heading style={h1}>Email Successfully Linked! 🎉</Heading>
          
          <Text style={text}>
            Hi {displayName},
          </Text>
          
          <Text style={text}>
            Great news! Your email address <strong>{email}</strong> has been successfully linked to your ChatLearn account.
          </Text>

          <Section style={featuresSection}>
            <Heading style={h2}>What This Means:</Heading>
            <Text style={featureItem}>
              ✅ You can now sign in with your email and password
            </Text>
            <Text style={featureItem}>
              🔒 Your account security has been enhanced
            </Text>
            <Text style={featureItem}>
              📧 You'll receive important updates at this email
            </Text>
            <Text style={featureItem}>
              🔄 You can still use your other sign-in methods
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Link
              href="https://www.chatl.ai/chat"
              target="_blank"
              style={button}
            >
              Continue to ChatLearn
            </Link>
          </Section>

          <Text style={text}>
            If you didn't link this email to your account, please contact us immediately through our{' '}
            <Link href="https://www.chatl.ai/help" target="_blank" style={link}>
              help center
            </Link>
            .
          </Text>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} ChatLearn. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://www.chatl.ai/privacy" style={footerLink}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href="https://www.chatl.ai/terms" style={footerLink}>
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailLinkedEmail;

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

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 16px',
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
  padding: '0 20px',
};

const featuresSection = {
  margin: '32px 0',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px 20px',
};

const featureItem = {
  color: '#484848',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
  paddingLeft: '8px',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const link = {
  color: '#000000',
  textDecoration: 'underline',
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
