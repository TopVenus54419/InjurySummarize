"use client";

import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SimpleUploadButton } from "../_components/SimpleUploadButton";
import { SignIn } from "@clerk/nextjs";

export default function UploadPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="container mx-auto min-h-screen max-w-2xl p-8 pt-24">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  // Show sign-in page if user is not authenticated
  if (!isSignedIn) {
    return (
      <div className="container mx-auto min-h-screen max-w-md p-8 pt-24">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold text-white">
            Sign in to Upload Documents
          </h1>
          <p className="text-muted-foreground">
            Please sign in to access the document upload feature.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-screen max-w-2xl p-8 pt-24">
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-white">
            Upload Incident Report PDF
          </h1>
          <p className="text-muted-foreground">
            Upload an incident report PDF to extract incident details and generate analysis.
          </p>
        </div>

        <Card className="bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Document Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload button */}
            <SimpleUploadButton documentType="incident" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
