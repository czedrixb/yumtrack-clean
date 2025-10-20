import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <header className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/settings')}
          className="flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6 space-y-6 prose prose-sm max-w-none">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <div className="space-y-3">
              <p>
                <strong>Personal Information:</strong> When you create an account, we collect your email address, display name, and authentication information.
              </p>
              <p>
                <strong>Food Images:</strong> We collect images of food that you upload or capture through our app for nutritional analysis.
              </p>
              <p>
                <strong>Analysis Data:</strong> We store the nutritional analysis results generated from your food images, including food names, ingredients, and nutritional information.
              </p>
              <p>
                <strong>Usage Data:</strong> We collect information about how you interact with our app, including features used and timestamps.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
            <div className="space-y-3">
              <p>
                <strong>Nutrition Analysis:</strong> Your food images are processed by OpenAI's API to generate nutritional information. These images are not used to train OpenAI's models.
              </p>
              <p>
                <strong>Personalization:</strong> To provide you with personalized nutrition tracking and history.
              </p>
              <p>
                <strong>App Improvement:</strong> To improve our services and develop new features.
              </p>
              <p>
                <strong>Communication:</strong> To send you important updates about our services (account-related notifications).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Data Storage and Security</h2>
            <div className="space-y-3">
              <p>
                <strong>Data Storage:</strong> Your data is stored securely on our servers. Food images and analysis results are associated with your account and protected by authentication.
              </p>
              <p>
                <strong>Data Retention:</strong> We retain your data for as long as your account is active. You can delete your account and associated data at any time.
              </p>
              <p>
                <strong>Security Measures:</strong> We implement industry-standard security measures to protect your data, including encryption and secure authentication.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Third-Party Services</h2>
            <div className="space-y-3">
              <p>
                <strong>OpenAI API:</strong> We use OpenAI's API to analyze food images. Your images are sent to OpenAI for processing but are not stored by OpenAI for training purposes.
              </p>
              <p>
                <strong>Firebase Authentication:</strong> We use Firebase for user authentication and account management.
              </p>
              <p>
                <strong>Analytics:</strong> We may use analytics services to understand app usage patterns and improve user experience.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
            <div className="space-y-3">
              <p>
                <strong>Access and Correction:</strong> You can access and update your personal information through the app settings.
              </p>
              <p>
                <strong>Data Deletion:</strong> You can delete your account and all associated data through the app settings.
              </p>
              <p>
                <strong>Opt-out:</strong> You can opt out of non-essential communications at any time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> uedu.dev@gmail.com<br />
              <strong>Developer:</strong> W Soft Labs
            </p>
          </section>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={() => setLocation('/settings')}>
          Back to Settings
        </Button>
      </div>
    </main>
  );
}