"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Play, FileText, RefreshCw, Save } from "lucide-react";
import { generateIncidentAnalysis, extractIncidentFields } from "~/lib/actions/generate-marketing-strength";
import { processPdfUpload } from "~/lib/actions/process-pdf-upload";
import { toast } from "sonner";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "~/lib/constants";

interface IncidentData {
  dateOfInjury: string;
  locationOfIncident: string;
  causeOfIncident: string;
  typeOfIncident: string;
  statutoryViolationsCited: string[];
  summary: string;
}

interface ProcessedPdfData {
  fileName: string;
  extractedText: string;
  analyzedData: {
    selectedEpisodes: string[];
    campaignGoals: string[];
    campaignKPIs: string[];
    gender: string;
    ethnicity: string[];
    age: string[];
    fansOf: string[];
  };
  uploadTime: string;
}

interface SessionPdfData {
  url: string;
  pdfId: number;
  fileName: string;
  documentType: string;
  uploadTime: string;
}

export default function GeneratePage() {
  const [outputs, setOutputs] = useState<string[]>(["", "", ""]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfData, setPdfData] = useState<ProcessedPdfData | null>(null);

  const [incidentData, setIncidentData] = useState<IncidentData>({
    dateOfInjury: "January 15, 2024",
    locationOfIncident: "Construction Site - Building A",
    causeOfIncident: "Fall from scaffolding",
    typeOfIncident: "Workplace Accident",
    statutoryViolationsCited: ["OSHA 1926.451", "Safety Training Violation"],
    summary: "Worker fell from scaffolding due to improper safety equipment and lack of training.",
  });

  // Process PDF data from session storage
  useEffect(() => {
    const processPdfFromSession = async () => {
      const pdfDataStr: string | null =
        sessionStorage.getItem("currentPdfData");
      if (pdfDataStr) {
        try {
          const pdfData: SessionPdfData = JSON.parse(
            pdfDataStr,
          ) as SessionPdfData;

          // Validate the stored data
          if (!pdfData.url || typeof pdfData.url !== "string") {
            sessionStorage.removeItem("currentPdfData");
            toast.error(
              "Invalid PDF data found. Please upload a new incident report PDF.",
            );
            return;
          }

          setIsAnalyzing(true);

          // Call the process-pdf-upload action
          const result = await processPdfUpload({
            fileUrl: pdfData.url,
            documentType: pdfData.documentType || "incident", // Use incident document type
          });

          if (result.validationErrors) {
            // Convert all error values to strings safely, handling objects/arrays
            const errorMessage = Object.values(result.validationErrors)
              .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
              .join(", ");

            // If it's a file not found error, clear the session storage
            if (
              errorMessage.includes("not found") ||
              errorMessage.includes("Invalid filename")
            ) {
              sessionStorage.removeItem("currentPdfData");
              toast.error("PDF file not found. Please upload a new PDF file.");
            } else {
              toast.error("Validation error: " + errorMessage);
            }
            return;
          }

          if (result.serverError) {
            // If it's a file not found error, clear the session storage
            if (
              result.serverError.includes("not found") ||
              result.serverError.includes("Invalid filename")
            ) {
              sessionStorage.removeItem("currentPdfData");
              toast.error("PDF file not found. Please upload a new PDF file.");
            } else {
              toast.error("Server error: " + result.serverError);
            }
            return;
          }

          if (result.data) {
            const processedData: ProcessedPdfData = {
              fileName: result.data.fileName,
              extractedText: result.data.extractedText,
              analyzedData: result.data.analyzedData,
              uploadTime: new Date().toISOString(),
            };

            setPdfData(processedData);

            // Extract incident fields from PDF text
            await extractFieldsFromPdf(result.data.extractedText);
          } else {
            throw new Error("No data returned from PDF processing");
          }
        } catch (error) {
          // Clear invalid session storage data
          sessionStorage.removeItem("currentPdfData");
          if (error instanceof Error) {
            toast.error(error.message);
          } else {
            toast.error(ERROR_MESSAGES.PROCESSING_FAILED);
          }
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    void processPdfFromSession();
  }, []);

  // Function to extract incident fields from PDF text
  const extractFieldsFromPdf = async (pdfText: string) => {
    setIsExtracting(true);
    try {
      const result = await extractIncidentFields({
        pdfText: pdfText,
      });

      if (result.data?.extractedFields) {
        setIncidentData((prev) => ({
          ...prev,
          dateOfInjury: result.data!.extractedFields.dateOfInjury,
          locationOfIncident: result.data!.extractedFields.locationOfIncident,
          causeOfIncident: result.data!.extractedFields.causeOfIncident,
          typeOfIncident: result.data!.extractedFields.typeOfIncident,
          statutoryViolationsCited: result.data!.extractedFields.statutoryViolationsCited,
        }));
        toast.success("Incident fields extracted successfully from PDF");
      } else if (result.validationErrors) {
        toast.error("Failed to extract fields from PDF");
      }
    } catch {
      toast.error("Error extracting fields from PDF");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const result = await generateIncidentAnalysis({
        dateOfInjury: incidentData.dateOfInjury,
        locationOfIncident: incidentData.locationOfIncident,
        causeOfIncident: incidentData.causeOfIncident,
        typeOfIncident: incidentData.typeOfIncident,
        statutoryViolationsCited: incidentData.statutoryViolationsCited,
        pdfText: pdfData?.extractedText ?? "",
      });

      if (result.data) {
        setOutputs([result.data.summary, "", ""]);
        toast.success(SUCCESS_MESSAGES.GENERATION_COMPLETE);
      } else if (result.validationErrors) {
        setOutputs([
          "Error: Invalid input data. Please check your incident report fields.",
          "Error: Invalid input data. Please check your incident report fields.",
          "Error: Invalid input data. Please check your incident report fields.",
        ]);
        toast.error("Validation error occurred");
      } else {
        setOutputs([
          "Error: Failed to generate incident analysis. Please try again.",
          "Error: Failed to generate incident analysis. Please try again.",
          "Error: Failed to generate incident analysis. Please try again.",
        ]);
        toast.error("Failed to generate incident analysis");
      }
    } catch (error) {
      setOutputs([
        "Error: Network error occurred. Please check your connection and try again.",
        "Error: Network error occurred. Please check your connection and try again.",
        "Error: Network error occurred. Please check your connection and try again.",
      ]);
      toast.error(
        `${error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!outputs[0]) {
      toast.error("No summary to save. Please generate a summary first.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await generateIncidentAnalysis({
        dateOfInjury: incidentData.dateOfInjury,
        locationOfIncident: incidentData.locationOfIncident,
        causeOfIncident: incidentData.causeOfIncident,
        typeOfIncident: incidentData.typeOfIncident,
        statutoryViolationsCited: incidentData.statutoryViolationsCited,
        pdfText: pdfData?.extractedText ?? "",
      });

      if (result.data) {
        toast.success("Incident analysis saved successfully to database!");
      } else if (result.validationErrors) {
        toast.error("Validation error occurred while saving");
      } else {
        toast.error("Failed to save incident analysis");
      }
    } catch (error) {
      toast.error(
        `${error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 px-6 pt-32 pb-6">
      {/* Progress Bar */}
      <div className="mx-auto mb-8 max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Incident Analysis</h1>
          <span className="text-sm text-gray-300">Legal Analysis</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Panel - Input/Details */}
        <div className="space-y-6">
          {/* PDF Analysis Status */}
          {pdfData && (
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                  <FileText className="h-5 w-5" />
                  PDF Analysis Status
                </CardTitle>
                <p className="mt-1 text-sm text-gray-300">
                  File: {pdfData.fileName}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAnalyzing ? (
                  <div className="flex items-center gap-3 rounded-md border border-blue-500/30 bg-blue-600/20 p-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-300"></div>
                    <p className="text-sm text-blue-300">
                      Processing PDF and extracting incident parameters...
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-green-500/30 bg-green-600/20 p-3">
                    <p className="text-sm text-green-300">
                      ✓ {SUCCESS_MESSAGES.PDF_PROCESSED}
                    </p>
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  <p>
                    Extracted text length: {pdfData.extractedText.length}{" "}
                    characters
                  </p>
                  <p>
                    Processed at:{" "}
                    {new Date(pdfData.uploadTime).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show upload button if no PDF data */}
          {!pdfData && (
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                  <FileText className="h-5 w-5" />
                  No PDF Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-blue-500/30 bg-blue-600/20 p-3">
                  <p className="text-sm text-blue-300">
                    Please upload a PDF file to extract incident parameters.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Incident Parameters */}
          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-white">
                  Incident Parameters
                </CardTitle>
                {pdfData && (
                  <Button
                    onClick={() => extractFieldsFromPdf(pdfData.extractedText)}
                    disabled={isExtracting}
                    size="sm"
                    variant="outline"
                    className="border-blue-500/30 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
                  >
                    {isExtracting ? (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Re-extract
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Date of Injury
                </Label>
                <div className="mt-2 rounded-md bg-gray-700/50 px-3 py-2 text-sm text-white">
                  {incidentData.dateOfInjury}
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Location of Incident
                </Label>
                <div className="mt-2 rounded-md bg-gray-700/50 px-3 py-2 text-sm text-white">
                  {incidentData.locationOfIncident}
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Cause of Incident
                </Label>
                <div className="mt-2 rounded-md bg-gray-700/50 px-3 py-2 text-sm text-white">
                  {incidentData.causeOfIncident}
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Type of Incident
                </Label>
                <div className="mt-2 rounded-md bg-gray-700/50 px-3 py-2 text-sm text-white">
                  {incidentData.typeOfIncident}
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Statutory Violations Cited
                </Label>
                <div className="mt-2 space-y-1">
                  {incidentData.statutoryViolationsCited.map((violation, index) => (
                    <div
                      key={index}
                      className="rounded-md bg-gray-700/50 px-3 py-2 text-sm text-white"
                    >
                      {violation}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isAnalyzing || isExtracting}
            className="w-full cursor-pointer border-0 bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:from-purple-700 hover:to-purple-600"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Generating...
              </>
            ) : isAnalyzing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Processing PDF...
              </>
            ) : isExtracting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Extracting Fields...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Incident Analysis
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Output */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Generated Summary
          </h2>

          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white">
                  Summary
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isGenerating
                      ? "border-blue-500/30 bg-blue-600/20 text-blue-300"
                      : outputs[0]
                        ? "border-green-500/30 bg-green-600/20 text-green-300"
                        : "border-red-500/30 bg-red-600/20 text-red-300"
                  }`}
                >
                  {isGenerating
                    ? "Generating"
                    : outputs[0]
                      ? "Generated"
                      : "Not yet"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent mb-4"></div>
                  <span className="text-blue-300 font-semibold">Generating...</span>
                </div>
              ) : (
                <>
                  <Textarea
                    value={outputs[0]}
                    placeholder="Your summary will appear here after you submit."
                    className="min-h-[400px] resize-none border-gray-600 bg-gray-700/50 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    readOnly
                  />
                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !outputs[0]}
                    className="w-full cursor-pointer border-0 bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/25 transition-all duration-200 hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save to Database
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
