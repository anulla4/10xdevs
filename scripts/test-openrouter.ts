/**
 * Test skrypt dla OpenRouter Service
 * Sprawdza czy serwis działa z prawdziwym API
 * 
 * Użycie:
 * 1. Dodaj OPENROUTER_API_KEY do .env
 * 2. npm install tsx (jeśli nie masz)
 * 3. npx tsx scripts/test-openrouter.ts
 */

import { OpenRouterService } from "../src/lib/services/openrouter.service"
import { z } from "zod"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

const API_KEY = process.env.OPENROUTER_API_KEY

if (!API_KEY) {
  console.error("❌ Błąd: Brak OPENROUTER_API_KEY w pliku .env")
  console.log("\nDodaj do .env:")
  console.log("OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx")
  console.log("\nKlucz możesz wygenerować na: https://openrouter.ai/keys")
  process.exit(1)
}

console.log("🚀 Test OpenRouter Service\n")

const service = new OpenRouterService(API_KEY, {
  defaultModel: "google/gemini-flash-1.5",
  appName: "Nature Log Test",
  timeoutMs: 30_000,
  maxRetries: 1,
})

// Test 1: Prosty czat
async function test1_SimpleChat() {
  console.log("📝 Test 1: Prosty czat")
  try {
    const result = await service.generateChat({
      system: "Odpowiadaj bardzo krótko, maksymalnie 2 zdania.",
      user: "Wymień 2 gatunki ptaków wodnych w Polsce.",
    })

    console.log("✅ Sukces!")
    console.log("Odpowiedź:", result.content)
    console.log("Model użyty:", (result.raw as any)?.model || "nieznany")
    console.log()
    return true
  } catch (error) {
    console.error("❌ Błąd:", error)
    console.log()
    return false
  }
}

// Test 2: Strukturyzowana odpowiedź (JSON Schema)
async function test2_StructuredResponse() {
  console.log("📝 Test 2: Strukturyzowana odpowiedź (JSON Schema)")
  try {
    const result = await service.generateChat({
      system: "Zwracaj wyniki w formacie JSON zgodnie ze schematem.",
      user: "Podaj 2 gatunki ptaków z nazwą polską i łacińską.",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bird_list",
          strict: true,
          schema: {
            type: "object",
            properties: {
              birds: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    polish_name: { type: "string" },
                    latin_name: { type: "string" },
                  },
                  required: ["polish_name", "latin_name"],
                  additionalProperties: false,
                },
              },
            },
            required: ["birds"],
            additionalProperties: false,
          },
        },
      },
    })

    // Walidacja z Zod
    const BirdSchema = z.object({
      birds: z.array(
        z.object({
          polish_name: z.string(),
          latin_name: z.string(),
        })
      ),
    })

    const validated = service.validateStructured(result.content, BirdSchema)

    console.log("✅ Sukces!")
    console.log("Zwalidowane dane:", JSON.stringify(validated, null, 2))
    console.log()
    return true
  } catch (error) {
    console.error("❌ Błąd:", error)
    console.log()
    return false
  }
}

// Test 3: Różne modele
async function test3_DifferentModel() {
  console.log("📝 Test 3: Użycie innego modelu (withModel)")
  try {
    const gpt4Mini = service.withModel("openai/gpt-4o-mini", {
      temperature: 0.3,
    })

    const result = await gpt4Mini.generateChat({
      user: "Odpowiedz jednym słowem: jaki kolor ma niebo?",
    })

    console.log("✅ Sukces!")
    console.log("Odpowiedź:", result.content)
    console.log("Model użyty:", (result.raw as any)?.model || "nieznany")
    console.log()
    return true
  } catch (error) {
    console.error("❌ Błąd:", error)
    console.log()
    return false
  }
}

// Test 4: Streaming (opcjonalny - wymaga więcej czasu)
async function test4_Streaming() {
  console.log("📝 Test 4: Streaming")
  try {
    let fullResponse = ""
    let chunkCount = 0

    for await (const chunk of service.streamChat({
      system: "Odpowiadaj bardzo krótko.",
      user: "Opisz bobra w 1 zdaniu.",
    })) {
      if (chunk.delta) {
        fullResponse += chunk.delta
        chunkCount++
        process.stdout.write(chunk.delta) // Wyświetl na bieżąco
      }
      if (chunk.done) {
        break
      }
    }

    console.log("\n✅ Sukces!")
    console.log(`Otrzymano ${chunkCount} chunków`)
    console.log("Pełna odpowiedź:", fullResponse)
    console.log()
    return true
  } catch (error) {
    console.error("❌ Błąd:", error)
    console.log()
    return false
  }
}

// Test 5: buildMessages
function test5_BuildMessages() {
  console.log("📝 Test 5: buildMessages (unit test)")
  try {
    // Test z system + user string
    const messages1 = service.buildMessages({
      system: "Jesteś asystentem.",
      user: "Cześć!",
    })

    if (
      messages1.length !== 2 ||
      messages1[0].role !== "system" ||
      messages1[1].role !== "user"
    ) {
      throw new Error("Nieprawidłowa struktura messages1")
    }

    // Test z message array
    const messages2 = service.buildMessages({
      user: [
        { role: "user", content: "Pytanie 1" },
        { role: "assistant", content: "Odpowiedź 1" },
        { role: "user", content: "Pytanie 2" },
      ],
    })

    if (messages2.length !== 3) {
      throw new Error("Nieprawidłowa struktura messages2")
    }

    console.log("✅ Sukces!")
    console.log("messages1:", JSON.stringify(messages1))
    console.log("messages2:", JSON.stringify(messages2))
    console.log()
    return true
  } catch (error) {
    console.error("❌ Błąd:", error)
    console.log()
    return false
  }
}

// Uruchom wszystkie testy
async function runAllTests() {
  console.log("=" .repeat(60))
  console.log("OpenRouter Service - Testy Integracyjne")
  console.log("=" .repeat(60))
  console.log()

  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
  }

  // Testy jednostkowe (bez API)
  results.test5 = test5_BuildMessages()

  // Testy integracyjne (z API)
  console.log("⚠️  Następne testy będą wykonywać prawdziwe wywołania API")
  console.log("   Koszt: ~$0.0001 (praktycznie darmowe)\n")

  results.test1 = await test1_SimpleChat()
  results.test2 = await test2_StructuredResponse()
  results.test3 = await test3_DifferentModel()

  // Streaming (opcjonalny)
  const runStreaming = process.argv.includes("--stream")
  if (runStreaming) {
    results.test4 = await test4_Streaming()
  } else {
    console.log("⏭️  Test 4 (streaming) pominięty. Użyj --stream aby uruchomić.\n")
  }

  // Podsumowanie
  console.log("=" .repeat(60))
  console.log("Podsumowanie testów:")
  console.log("=" .repeat(60))

  const passed = Object.values(results).filter(Boolean).length
  const total = runStreaming ? 5 : 4

  console.log(`Test 1 (Prosty czat): ${results.test1 ? "✅" : "❌"}`)
  console.log(`Test 2 (JSON Schema): ${results.test2 ? "✅" : "❌"}`)
  console.log(`Test 3 (Różne modele): ${results.test3 ? "✅" : "❌"}`)
  console.log(`Test 4 (Streaming): ${runStreaming ? (results.test4 ? "✅" : "❌") : "⏭️  pominięty"}`)
  console.log(`Test 5 (buildMessages): ${results.test5 ? "✅" : "❌"}`)
  console.log()
  console.log(`Wynik: ${passed}/${total} testów przeszło`)

  if (passed === total) {
    console.log("\n🎉 Wszystkie testy przeszły pomyślnie!")
    console.log("OpenRouter Service działa poprawnie! 🚀")
  } else {
    console.log("\n⚠️  Niektóre testy nie przeszły. Sprawdź błędy powyżej.")
    process.exit(1)
  }
}

// Uruchom
runAllTests().catch((error) => {
  console.error("\n💥 Nieoczekiwany błąd:", error)
  process.exit(1)
})
