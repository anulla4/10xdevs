import { useState, useRef } from "react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"

interface AIStreamChatProps {
  systemPrompt?: string
  placeholder?: string
  onComplete?: (fullResponse: string) => void
  className?: string
}

/**
 * AI chat component with streaming support
 * Displays response incrementally as tokens arrive
 * Requires streaming endpoint at /api/ai/chat-stream
 */
export function AIStreamChat({
  systemPrompt = "Jesteś asystentem Nature Log. Odpowiadasz zwięźle i pomocnie.",
  placeholder = "Zadaj pytanie...",
  onComplete,
  className = "",
}: AIStreamChatProps) {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setResponse("")

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch("/api/ai/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          user: prompt,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message ?? "Request failed")
      }

      if (!res.body) {
        throw new Error("Response body is null")
      }

      // Read stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(line.slice(6))
              if (chunk.delta) {
                fullResponse += chunk.delta
                setResponse(fullResponse)
              }
              if (chunk.done) {
                onComplete?.(fullResponse)
              }
            } catch {
              // Skip malformed JSON
              continue
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Żądanie zostało anulowane")
      } else {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        console.error("AI stream error:", err)
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleCancel = () => {
    abortControllerRef.current?.abort()
    setLoading(false)
  }

  const handleClear = () => {
    setPrompt("")
    setResponse("")
    setError(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-stream-prompt">Twoje pytanie</Label>
          <Textarea
            id="ai-stream-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            rows={4}
            disabled={loading}
            className="resize-none"
          />
        </div>

        <div className="flex gap-2">
          {loading ? (
            <Button type="button" variant="destructive" onClick={handleCancel}>
              Anuluj
            </Button>
          ) : (
            <Button type="submit" disabled={!prompt.trim()}>
              Wyślij (streaming)
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={loading}
          >
            Wyczyść
          </Button>
        </div>
      </form>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <strong>Błąd:</strong> {error}
        </div>
      )}

      {(response || loading) && (
        <div className="space-y-2">
          <Label>
            Odpowiedź AI{" "}
            {loading && (
              <span className="text-muted-foreground">(generowanie...)</span>
            )}
          </Label>
          <div className="rounded-md border bg-muted/50 p-4 text-sm min-h-[100px]">
            <pre className="whitespace-pre-wrap font-sans">
              {response}
              {loading && <span className="animate-pulse">▊</span>}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
