/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { z } from "zod";
import { env } from "~/env";
import { returnValidationErrors } from "next-safe-action";
import { actionClient } from "~/lib/safe-action";
import { db } from "~/server/db";
import { currentUser } from "@clerk/nextjs/server";
import { ERROR_MESSAGES } from "../constants";

const generateIncidentAnalysisSchema = z.object({
  dateOfInjury: z.string().min(1, "Date of injury is required"),
  locationOfIncident: z.string().min(1, "Location of incident is required"),
  causeOfIncident: z.string().min(1, "Cause of incident is required"),
  typeOfIncident: z.string().min(1, "Type of incident is required"),
  statutoryViolationsCited: z
    .array(z.string())
    .min(1, "At least one statutory violation must be specified"),
  pdfText: z.string().min(1, "PDF text is required"),
});

// --- OpenAI API Response Types ---
interface OpenAIMessage {
  role: string;
  content: string;
}
interface OpenAIChoice {
  message: OpenAIMessage;
}
interface OpenAIResponse {
  choices?: OpenAIChoice[];
}

// Function to generate summary from PDF text
async function generateSummary(pdfText: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a legal document analyst. Create a concise summary of the provided text, focusing on key incident details, legal implications, and important facts. Keep the summary to a maximum of 10 sentences.",
          },
          {
            role: "user",
            content: `Please summarize the following incident report text:\n\n${pdfText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
      );
    }

    const result: OpenAIResponse = await response.json();
    const generatedText = result.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No summary generated from OpenAI");
    }

    return generatedText;
  } catch (error) {
    return `Summary generation failed: ${error instanceof Error ? error.message : ERROR_MESSAGES.PROCESSING_FAILED}`;
  }
}

export const generateIncidentAnalysis = actionClient
  .inputSchema(generateIncidentAnalysisSchema)
  .action(async ({ parsedInput: data }) => {
    try {
      // Check authentication
      const user = await currentUser();
      if (!user) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      // Generate summary from PDF text
      const summary = await generateSummary(data.pdfText);

      const prompt = `You are a legal and safety analysis expert specializing in workplace incidents and compliance. Given the incident details below, generate a comprehensive "Incident Analysis" report. The output should be professional, thorough, and suitable for legal documentation or safety reports.

## INCIDENT DETAILS
- Date of Injury: ${data.dateOfInjury}
- Location of Incident: ${data.locationOfIncident}
- Cause of Incident: ${data.causeOfIncident}
- Type of Incident: ${data.typeOfIncident}
- Statutory Violations Cited: ${data.statutoryViolationsCited.join(", ")}

## OUTPUT GUIDELINES
- Provide a detailed analysis of the incident circumstances and contributing factors.
- Assess the severity and potential legal implications of the statutory violations.
- Include recommendations for prevention and compliance improvement.
- Address any patterns or systemic issues that may have contributed to the incident.
- Tone should be professional, objective, and legally sound.

Now generate the "Incident Analysis" section. Should be comprehensive and well-structured for legal or safety documentation.`;

      // Generate incident analysis
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a legal and safety analysis expert specializing in workplace incidents and compliance. Generate professional, thorough incident analysis reports suitable for legal documentation.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`,
        );
      }

      const result: OpenAIResponse = await response.json();
      const analysis = result.choices?.[0]?.message?.content;

      if (!analysis) {
        throw new Error("No analysis generated from OpenAI");
      }

      // Save to database
      const incidentAnalysis = await db.incidentAnalysis.create({
        data: {
          dateOfInjury: data.dateOfInjury,
          locationOfIncident: data.locationOfIncident,
          causeOfIncident: data.causeOfIncident,
          typeOfIncident: data.typeOfIncident,
          statutoryViolationsCited: data.statutoryViolationsCited,
          summary: summary,
          userId: user.id,
        },
      });

      return {
        summary: summary,
        analysis: analysis,
        id: incidentAnalysis.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        return returnValidationErrors(generateIncidentAnalysisSchema, {
          _errors: [error.message],
        });
      }
      return returnValidationErrors(generateIncidentAnalysisSchema, {
        _errors: [ERROR_MESSAGES.PROCESSING_FAILED],
      });
    }
  });

// Action to retrieve incident analysis history for a user
export const getIncidentAnalysisHistory = actionClient.action(async () => {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Get all incident analysis records for the user
    const history = await db.incidentAnalysis.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to last 10 records
    });

    return {
      history,
    };
  } catch (error) {
    if (error instanceof Error) {
      return returnValidationErrors(generateIncidentAnalysisSchema, {
        _errors: [error.message],
      });
    }
    return returnValidationErrors(generateIncidentAnalysisSchema, {
      _errors: [ERROR_MESSAGES.PROCESSING_FAILED],
    });
  }
});

// Function to extract incident fields from PDF text
export const extractIncidentFields = actionClient
  .inputSchema(z.object({
    pdfText: z.string().min(1, "PDF text is required"),
  }))
  .action(async ({ parsedInput: data }) => {
    try {
      // Check authentication
      const user = await currentUser();
      if (!user) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const prompt = `You are a legal document analyst. Extract the following 5 fields from the provided incident report text:

1. Date of Injury: The date when the injury occurred
2. Location of Incident: Where the incident took place
3. Cause of Incident: What caused the incident
4. Type of Incident: The category/type of incident
5. Statutory Violations Cited: Any legal violations mentioned (return as array)

Please extract these fields from the following text and return them in JSON format:

${data.pdfText}

Return only valid JSON with these exact field names:
{
  "dateOfInjury": "extracted date",
  "locationOfIncident": "extracted location", 
  "causeOfIncident": "extracted cause",
  "typeOfIncident": "extracted type",
  "statutoryViolationsCited": ["violation1", "violation2"]
}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a legal document analyst. Extract specific fields from incident reports and return them in valid JSON format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`,
        );
      }

      const result: OpenAIResponse = await response.json();
      const extractedText = result.choices?.[0]?.message?.content;

      if (!extractedText) {
        throw new Error("No fields extracted from OpenAI");
      }

      // Parse the JSON response
      try {
        interface ExtractedFields {
          dateOfInjury?: string;
          locationOfIncident?: string;
          causeOfIncident?: string;
          typeOfIncident?: string;
          statutoryViolationsCited?: string[];
        }
        const extractedFields: ExtractedFields = JSON.parse(extractedText);
        // Validate the extracted fields
        const validatedFields = {
          dateOfInjury: extractedFields.dateOfInjury ?? "Not specified",
          locationOfIncident: extractedFields.locationOfIncident ?? "Not specified",
          causeOfIncident: extractedFields.causeOfIncident ?? "Not specified",
          typeOfIncident: extractedFields.typeOfIncident ?? "Not specified",
          statutoryViolationsCited: Array.isArray(extractedFields.statutoryViolationsCited)
            ? extractedFields.statutoryViolationsCited
            : ["Not specified"],
        };
        return {
          extractedFields: validatedFields,
        };
      } catch {
        throw new Error("Failed to parse extracted fields from AI response");
      }
    } catch (error) {
      if (error instanceof Error) {
        return returnValidationErrors(z.object({
          pdfText: z.string(),
        }), {
          _errors: [error.message],
        });
      }
      return returnValidationErrors(z.object({
        pdfText: z.string(),
      }), {
        _errors: [ERROR_MESSAGES.PROCESSING_FAILED],
      });
    }
  });
