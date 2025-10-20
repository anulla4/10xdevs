import { useState } from "react"
import type { ChatResult } from "../../types"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"

interface AIChatBoxProps {
  systemPrompt?: string
  placeholder?: string
  onResponse?: (response: string) => void
  className?: string
}

/**
 * Simple AI chat component using OpenRouter API
 * Non-streaming, displays full response after completion
 */
export function AIChatBox({
  systemPrompt = "Jesteś asystentem Nature Log. Odpowiadasz zwięźle i pomocnie.",
  placeholder = "Zadaj pytanie...",
  onResponse,
  className = "",
}: AIChatBoxProps) {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setResponse("")

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          user: prompt,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message ?? "Request failed")
      }

      const data: ChatResult = await res.json()
      setResponse(data.content)
      onResponse?.(data.content)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      console.error("AI chat error:", err)
    } finally {
      setLoading(false)
    }
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
          <Label htmlFor="ai-prompt">Twoje pytanie</Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            rows={4}
            disabled={loading}
            className="resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !prompt.trim()}>
            {loading ? "Przetwarzanie..." : "Wyślij"}
          </Button>
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

      {response && (
        <div className="space-y-2">
          <Label>Odpowiedź AI</Label>
          <div className="rounded-md border bg-muted/50 p-4 text-sm">
            <pre className="whitespace-pre-wrap font-sans">{response}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
