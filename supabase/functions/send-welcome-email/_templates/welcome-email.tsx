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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  userEmail: string;
  userName?: string;
}

export const WelcomeEmail = ({
  userEmail,
  userName,
}: WelcomeEmailProps) => {
  const displayName = userName || userEmail.split('@')[0];
  
  return (
    <Html>
      <Head />
      <Preview>Your AI workspace is ready start exploring now.</Preview>
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
          <Heading style={h1}>Welcome to ChatLearn</Heading>
          
          <Text style={text}>
            Hi {displayName},
          </Text>
          
          <Text style={text}>
            Thank you for joining ChatLearn.
          </Text>
          
          <Text style={text}>
            We're excited to have you on board. Your account has been successfully created, and you're ready to start exploring the full power of AI.
          </Text>

          <Section style={featuresSection}>
            <Heading style={h2}>What You Can Do:</Heading>
            <Text style={featureItem}>
              • Chat with multiple AI models (GPT-5, Gemini, Claude, and more)
            </Text>
            <Text style={featureItem}>
              • Generate and edit images with AI
            </Text>
            <Text style={featureItem}>
              • Use voice mode for hands-free conversations
            </Text>
            <Text style={featureItem}>
              • Analyze PDFs and documents
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Link
              href="https://www.chatl.ai/chat"
              target="_blank"
              style={button}
            >
              Start Chatting Now
            </Link>
          </Section>

          <Text style={text}>
            Need help getting started? Contact us at{' '}
            <Link href="mailto:support@chatl.ai" style={link}>
              support@chatl.ai
            </Link>.
          </Text>
          
          <Text style={text}>
            Best regards,
          </Text>
          
          <Text style={text}>
            The ChatLearn Team
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
            <Text style={footerText}>
              You received this email because you created an account at ChatLearn.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  padding: '0 20px',
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
