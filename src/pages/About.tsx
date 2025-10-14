import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Zap, Shield, Users, CheckCircle, ArrowRight, Globe, Lock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="About Us - ChatLearn"
        description="Learn about ChatLearn's mission to democratize AI access. Discover how we bring the world's leading AI models together in one innovative platform."
        canonical="https://chatl.ai/about"
      />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 sm:mb-6">
            <Sparkles className="h-3 w-3 mr-2" />
            About ChatLearn
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            About Us
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Bringing the world's leading AI models together in one innovative platform
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container max-w-6xl mx-auto space-y-12">

          {/* Who We Are */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                Who We Are
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                ChatLearn is an innovative AI platform designed to bring the world's leading artificial intelligence models 
                together in one place.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Our mission is to make advanced AI technology accessible, intuitive, and useful for everyone — whether you're 
                an individual creator, a business professional, or a curious learner exploring the future of AI.
              </p>
              <div className="p-4 sm:p-6 bg-primary/10 border border-primary/20 rounded-lg mt-4">
                <p className="text-base sm:text-lg font-semibold text-foreground">
                  We believe that the true power of AI lies in simplicity.
                </p>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  That's why we built ChatLearn: a single, elegant platform where users can interact with multiple AI models 
                  seamlessly — all through one secure account.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Our Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                We aim to democratize access to artificial intelligence.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                AI shouldn't be complicated or limited to experts. ChatLearn bridges the gap between cutting-edge research 
                and everyday usability, giving people and teams the tools they need to create, learn, and grow with AI.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                From generating content and analyzing data to building ideas and automating workflows — ChatLearn empowers 
                users to do more, faster.
              </p>
            </CardContent>
          </Card>

          {/* Our Technology */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                Our Technology
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-4 sm:p-6 bg-muted/50 rounded-lg border">
                  <Globe className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">AI Model Integration</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    ChatLearn integrates the world's most powerful AI models, including OpenAI's GPT-4o, Google's Gemini, 
                    and other large language and image-generation models. All are accessed through secure, official APIs 
                    ensuring stability, compliance, and performance.
                  </p>
                </div>
                <div className="p-4 sm:p-6 bg-muted/50 rounded-lg border">
                  <Lock className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">Security & Privacy</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Our infrastructure is built for speed, privacy, and scalability. Every interaction is processed securely, 
                    and users have full control over their experience and data preferences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why ChatLearn */}
          <Card className="bg-gradient-to-br from-muted/30 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                Why ChatLearn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">All-in-One Platform</h3>
                  <p className="text-sm text-muted-foreground">Access multiple AI models with a single login.</p>
                </div>

                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Efficiency & Accuracy</h3>
                  <p className="text-sm text-muted-foreground">Get instant responses powered by top-tier language models.</p>
                </div>

                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Creative & Analytical</h3>
                  <p className="text-sm text-muted-foreground">Combine writing, research, coding, and image creation in one place.</p>
                </div>

                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Transparency & Security</h3>
                  <p className="text-sm text-muted-foreground">We value your trust; your data is always handled responsibly.</p>
                </div>

                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Constant Innovation</h3>
                  <p className="text-sm text-muted-foreground">We continuously update our models and features to stay ahead of technology trends.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Commitment */}
          <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                We are more than just an AI platform; we are a team of innovators, developers, and visionaries passionate 
                about redefining human-AI collaboration.
              </p>
              <p className="text-base sm:text-lg font-semibold text-foreground">
                Our goal is to make AI simple, reliable, and empowering for everyone, everywhere.
              </p>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
            <CardContent className="py-8 sm:py-12 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Join the Future of AI
              </h2>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90">
                Experience the next generation of intelligent tools. Explore multiple AI models, unlock creative potential, 
                and start building your future with ChatLearn today.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90 font-semibold text-base sm:text-lg px-6 sm:px-8"
                onClick={() => navigate('/')}
              >
                Try ChatLearn Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </section>
    </div>
  );
};

export default About;
