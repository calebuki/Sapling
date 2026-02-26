import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const transcribeSchema = z.object({
  audioBase64: z.string().optional(),
  language: z.string().default('fr-FR'),
  hintText: z.string().optional()
});

export async function registerAsrRoutes(app: FastifyInstance) {
  app.post('/asr/transcribe', async (request, reply) => {
    const parsed = transcribeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    return {
      transcript: parsed.data.hintText ?? '',
      confidence: 0,
      language: parsed.data.language,
      provider: 'stub',
      status: 'not_implemented',
      message:
        'ASR provider is not configured yet. Use browser SpeechRecognition when available or fallback to typing.'
    };
  });
}
