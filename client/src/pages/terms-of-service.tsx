import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6 space-y-6 prose prose-sm max-w-none">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using YumTrack ("the App"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              YumTrack is a mobile application that uses artificial intelligence to analyze food images and provide nutritional information. The service includes:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Food image analysis using OpenAI's API</li>
              <li>Nutritional information estimation</li>
              <li>Food analysis history tracking</li>
              <li>User account management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <div className="space-y-3">
              <p>
                <strong>Registration:</strong> You must create an account to access certain features of the App. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
              <p>
                <strong>Account Security:</strong> You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.
              </p>
              <p>
                <strong>Account Termination:</strong> We reserve the right to terminate or suspend accounts that violate these terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the App for any illegal purpose</li>
              <li>Upload harmful or malicious content</li>
              <li>Attempt to reverse engineer or hack the App</li>
              <li>Use the App to harass, abuse, or harm others</li>
              <li>Upload images that are not of food or are inappropriate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
            <div className="space-y-3">
              <p>
                The App and its original content, features, and functionality are owned by W Soft Labs and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                You retain ownership of the food images you upload. By uploading images, you grant us the license to process them through our AI analysis system.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Disclaimer of Medical Advice</h2>
            <div className="space-y-3">
              <p>
                <strong>Important:</strong> YumTrack provides nutritional estimates based on AI analysis of food images. This information is for general informational purposes only and is not medical advice.
              </p>
              <p>
                The nutritional information provided by the App is an estimate and may not be completely accurate. Always consult with qualified healthcare professionals for medical advice, diagnosis, or treatment.
              </p>
              <p>
                Do not use the App as a substitute for professional medical advice, diagnosis, or treatment. If you have specific dietary needs or medical conditions, consult with a healthcare professional.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, W Soft Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Service Modifications</h2>
            <p>
              We reserve the right to modify or discontinue, temporarily or permanently, the App with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the App immediately, without prior notice or liability, for any reason, including if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the developer operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
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