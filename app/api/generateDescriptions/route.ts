import Together from "together-ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { calculateCreditsRequired } from "@/lib/credits";

const together = new Together();

export async function POST(req: Request) {
  const json = await req.json();
  const result = z
    .object({
      imageUrl: z.string(),
      languages: z.array(z.string()),
      model: z.string(),
      length: z.string(),
      tone: z.string().optional(),
      userId: z.string().optional(),
      skipCreditCheck: z.boolean().optional().default(false),
    })
    .safeParse(json);

  if (result.error) {
    return new Response(result.error.message, { status: 422 });
  }

  const { languages, imageUrl, model, length, tone = "professional", userId, skipCreditCheck } = result.data;

  // Calculate credits required
  const creditsRequired = calculateCreditsRequired(languages, model);

  // For this demo, we'll return the credit requirement info
  // In a real application, you would check the database here
  if (!skipCreditCheck) {
    return Response.json({
      creditsRequired,
      error: 'INSUFFICIENT_CREDITS',
      message: `This operation requires ${creditsRequired} credits. Please purchase more credits to continue.`,
    }, { status: 402 }); // Payment Required status
  }

  let descriptions;
  let rawResponse;

  try {
    const res = await together.chat.completions.create({
      model,
      temperature: 0.2,
      stream: false,
      messages: [
        {
          role: "system",
          content: `
          You are a helpful product description generator that ONLY responses with JSON.
          `,
        },
        {
          role: "user",
          // @ts-expect-error need to fix the TypeScript library type
          content: [
            {
              type: "text",
              text: `Given this product image, return JSON of a Amazon-like ${length} sales product description in ${tone} tone in each of these languages. ${languages
                .map((language) => `"${language}"`)
                .join(", ")}

              Return a JSON object in the following shape: [{language: string, description, string},...]

              Note: This may be a GIF image showing product features or animation. Analyze any visible content, motion, or context to create compelling product descriptions.

              It is very important for my career that you follow these instructions exactly. PLEASE ONLY RETURN JSON, NOTHING ELSE.
              `,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    rawResponse = res.choices[0].message?.content;
    descriptions = JSON.parse(rawResponse || "[]");
    console.log({ rawResponse, descriptions });
  } catch (error) {
    const productDescriptionSchema = z.array(
      z.object({
        language: z.string().describe("the language specified"),
        description: z
          .string()
          .describe("the description of the product in the language specified"),
      }),
    );
    const jsonSchema = zodToJsonSchema(
      productDescriptionSchema,
      "productDescriptionSchema",
    );

    const extract = await together.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Parse out the valid JSON from this text.Only answer in JSON.",
        },
        {
          role: "user",
          content: rawResponse || "",
        },
      ],
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      // @ts-expect-error need to type the schema format
      response_format: { type: "json_object", schema: jsonSchema },
    });

    descriptions = JSON.parse(extract?.choices?.[0]?.message?.content || "[]");
    console.log(error);
  }

  return Response.json({
    descriptions,
    creditsUsed: creditsRequired,
  });
}

export const runtime = "edge";
