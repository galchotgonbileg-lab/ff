import fs from "fs";

export interface DetectedIngredient {
  labelEn: string;
  labelMn: string;
  confidence: number;
}

export class RecognitionServiceError extends Error {}

export async function detectIngredients(filePath: string, mimetype: string): Promise<DetectedIngredient[]> {
  const buffer = await fs.promises.readFile(filePath);
  const blob = new Blob([buffer], { type: mimetype });
  const form = new FormData();
  form.append("image", blob, filePath.split(/[/\\]/).pop());

  let response: Response;
  try {
    response = await fetch(`${process.env.RECOGNITION_SERVICE_URL}/detect`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    throw new RecognitionServiceError(`recognition service unreachable: ${(err as Error).message}`);
  }

  if (!response.ok) {
    throw new RecognitionServiceError(`recognition service returned ${response.status}`);
  }

  const data = (await response.json()) as { detections: DetectedIngredient[] };
  return data.detections;
}
