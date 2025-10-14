import React from 'react';
import SEO from '@/components/SEO';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Terms & Conditions"
        description="Terms and conditions for using ChatLearn AI platform. Learn about our service agreements, user rights, and platform policies."
      />
      
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-4xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 3, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Who We Are</h2>
            <p>
              ChatLearn ("we," "us," or "our") is an advanced AI platform that unifies access to multiple world-class Large Language Models (LLMs) and text-to-image systems under one secure interface and membership.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our current integrations include (subject to change):</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Language Models</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>GPT-5, GPT-4o, GPT-4o mini by OpenAI</li>
              <li>Claude Sonnet 4 by Anthropic</li>
              <li>Gemini 2.5 Flash by Google DeepMind</li>
              <li>Grok 4 by xAI</li>
              <li>DeepSeek V2 by DeepSeek</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Image Model</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>DALL-E 3 by OpenAI</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
            <p className="mb-4">
              ChatLearn is an independent platform and is not affiliated with, sponsored by, or endorsed by any of the AI model providers integrated into the Service.
            </p>
            <p className="mb-4">
              This includes, but is not limited to: OpenAI, Anthropic, Google DeepMind, xAI, DeepSeek, and Stability AI.
            </p>
            <p className="mb-4">
              All trademarks, brand names, and model names such as GPT-5, Claude Sonnet 4, Gemini 2.5 Flash, Grok 4, DeepSeek V2, and DALL-E 3 are the property of their respective owners.
            </p>
            <p className="mb-4">
              ChatLearn accesses these technologies exclusively through official APIs and legitimate service agreements, ensuring compliant and secure usage.
            </p>
            <p className="mb-4">
              We do not claim ownership, partnership, or operational control over any third-party models or providers.
            </p>
            <p>
              Our mission is to provide users with a unified, reliable interface to access multiple AI systems efficiently and securely.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">General Terms</h2>
            <p className="mb-4">
              By using ChatLearn ("the App," "the Platform," or "the Service"), you agree to these Terms of Use ("Terms") and our Privacy Policy.
            </p>
            <p className="mb-4">
              If you do not agree, you must not use the Service.
            </p>
            <p className="mb-4">
              Continued use of ChatLearn constitutes acceptance of these Terms and any updates made to them.
            </p>
            <p className="mb-4">
              ChatLearn shall not be liable for any direct or indirect damages, including data loss, revenue loss, or service interruptions.
            </p>
            <p>
              We reserve the right to modify pricing, plans, or usage policies at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">License</h2>
            <p className="mb-4">
              ChatLearn grants you a revocable, non-exclusive, non-transferable, limited license to use the Service strictly in accordance with these Terms.
            </p>
            <p>
              All rights not expressly granted are reserved by ChatLearn and its licensors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Restrictions</h2>
            <p className="mb-4">You agree not to, and will not permit others to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>License, sell, rent, or distribute the Service;</li>
              <li>Copy, modify, or create derivative works of the platform;</li>
              <li>Reverse-engineer or attempt to extract model data or API code;</li>
              <li>Remove copyright or trademark notices;</li>
              <li>Circumvent security or usage controls;</li>
              <li>Use ChatLearn to create competing AI services;</li>
              <li>Use outputs for unlawful, harmful, or deceptive purposes.</li>
            </ul>
            <p className="mt-4">
              Violation of these restrictions may result in immediate account termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Suggestions</h2>
            <p>
              Any feedback, comments, or ideas ("Suggestions") you provide shall be the exclusive property of ChatLearn, which may use them freely without credit or compensation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services and Model Availability</h2>
            <p className="mb-4">
              ChatLearn integrates external AI models and APIs, including OpenAI, Anthropic, Google DeepMind, xAI, DeepSeek, and Stability AI.
            </p>
            <p className="mb-4">
              While we strive to maintain consistent access to all integrations, their continued availability depends on third-party providers.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Model Availability</h3>
            <p className="mb-4">You acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The list of supported models may change at any time.</li>
              <li>ChatLearn may add, suspend, or remove any model, feature, or integration temporarily or permanently at its sole discretion.</li>
              <li>These changes may result from API cost changes, provider limitations, compliance obligations, or technical considerations.</li>
              <li>Such changes do not entitle users to refunds, compensation, or claims, as long as the core Service remains functional.</li>
              <li>Replacement or updated models with equivalent or enhanced capabilities may be introduced without notice.</li>
            </ul>
            <p className="mt-4">
              We will make reasonable efforts to inform users about significant model changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies and Privacy</h2>
            <p className="mb-4">
              We use cookies and analytics tools to operate, secure, and improve our platform.
            </p>
            <p className="mb-4">
              You can manage or disable cookies at any time through your browser or consent manager.
            </p>
            <p>
              Please see our Privacy Policy for full details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Subscription Terms</h2>
            <p className="mb-4">
              Certain features of ChatLearn are available through a paid subscription plan.
            </p>
            <p className="mb-4">
              Subscriptions renew automatically unless canceled before the renewal date.
            </p>
            <p>
              Payments are non-refundable except as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Free Trial</h2>
            <p className="mb-4">
              ChatLearn may offer a limited free trial (e.g., up to 3 messages) per user for evaluation purposes.
            </p>
            <p>
              The free trial is subject to fair-use and anti-abuse measures (including device, IP, and account checks). We may modify, suspend, or end the free trial at any time. Once the free quota is exhausted, continued use requires an active paid plan.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Fair Use and Additional Charges</h2>
            <p className="mb-4">
              ChatLearn operates under a fair use policy to maintain platform stability and ensure equitable access for all users.
            </p>
            <p className="mb-4">Users acknowledge and agree that:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Each subscription plan includes specific resource limits (such as message volume, token count, or image generations).</li>
              <li>ChatLearn continuously monitors system usage to detect excessive or disproportionate activity.</li>
              <li>If your usage significantly exceeds your plan's fair-use limits, ChatLearn may:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>(a) temporarily restrict or throttle your access;</li>
                  <li>(b) offer an upgrade to a higher-capacity plan; or</li>
                  <li>(c) apply additional charges based on excess usage.</li>
                </ul>
              </li>
              <li>Any additional charges will be communicated transparently via email, invoice, or within your account dashboard prior to billing.</li>
              <li>Continued or repeated overuse without resolution may result in suspension or termination of your account.</li>
              <li>Usage metrics and thresholds are determined internally by ChatLearn and may evolve over time as system capacity or model costs change.</li>
              <li>These measures are in place to maintain a stable and cost-efficient experience for all users.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
            <p className="mb-4">
              The ChatLearn platform is operated by TASOLAR, a company registered in the Republic of Cyprus.
            </p>
            <p className="mb-2">
              <strong>Registered Office:</strong> Dimostheni Severi & Katsoni 2, Avenue Court, 1082 Nicosia, Cyprus
            </p>
            <p className="mb-2">
              <strong>Email:</strong> <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>
            </p>
            <p>
              <strong>Website:</strong> <a href="https://chatl.ai" className="text-primary hover:underline">https://chatl.ai</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
