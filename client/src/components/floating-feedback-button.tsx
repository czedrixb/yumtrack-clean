import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Star } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";

const feedbackSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  rating: z
    .number()
    .min(1, "Please select a rating")
    .max(5, "Rating must be between 1 and 5"),
  message: z.string().min(10, "Feedback must be at least 10 characters"),
});

export default function FloatingFeedbackButton() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const { toast } = useToast();

  const feedbackForm = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: "",
      rating: 0,
      message: "",
    },
  });

  const onFeedbackSubmit = async (values: z.infer<typeof feedbackSchema>) => {
    setIsFeedbackSubmitting(true);

    try {
      // EmailJS configuration
      const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_98xbwrl";
      const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_a9bagiw";
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "CQ8ikKs9ILlgDBEPm";

      console.log("EmailJS Config:", { serviceID, templateID, publicKey });

      // Initialize EmailJS with public key
      emailjs.init(publicKey);

      const templateParams = {
        from_name: values.name,
        from_email: "noreply@yumtrack.app",
        to_name: "W Soft Labs Support",
        to_email: "uedu.dev@gmail.com",
        message: `From: ${values.name}\nRating: ${values.rating}/5 stars\n\nFeedback:\n${values.message}`,
        subject: "YumTrack Userfeedback",
        app_name: "YumTrack",
        user_name: values.name,
        user_rating: values.rating,
        reply_to: "noreply@yumtrack.app",
      };

      console.log("Sending email with params:", templateParams);

      const result = await emailjs.send(serviceID, templateID, templateParams);

      console.log("EmailJS Success:", result);

      toast({
        title: "Feedback Sent!",
        description: "Thank you for your feedback. We appreciate your input!",
      });

      feedbackForm.reset();
      setShowFeedbackModal(false);
    } catch (error) {
      console.error("EmailJS Error:", error);
      toast({
        title: "Failed to Send Feedback",
        description: "Please try again later or contact support directly.",
        variant: "destructive",
      });
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        onClick={() => setShowFeedbackModal(true)}
        aria-label="Send Feedback"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Feedback Modal */}
      <AlertDialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Share Your Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Share your thoughts about YumTrack! Tell us what you love, what could be improved, or suggest new features.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...feedbackForm}>
            <form
              onSubmit={feedbackForm.handleSubmit(onFeedbackSubmit)}
              className="space-y-4"
            >
              <FormField
                control={feedbackForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feedbackForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => field.onChange(star)}
                            className={`p-1 transition-colors ${
                              star <= field.value
                                ? "text-yellow-400"
                                : "text-gray-300 hover:text-yellow-200"
                            }`}
                          >
                            <Star
                              className="w-6 h-6"
                              fill={star <= field.value ? "currentColor" : "none"}
                            />
                          </button>
                        ))}
                        {field.value > 0 && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {field.value}/5 stars
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feedbackForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your thoughts, suggestions, or ideas for improvement..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" disabled={isFeedbackSubmitting}>
                  {isFeedbackSubmitting ? (
                    <>
                      <Mail className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}