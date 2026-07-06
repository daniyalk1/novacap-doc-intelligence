import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I can answer questions about NovaCap Bank internal documents. Upload a document first, then ask me anything about it.',
      sources: []
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`${API}/api/chat`, { question: input })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources || []
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        sources: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 24px'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              backgroundColor: msg.role === 'user' ? '#4f6ef7' : '#1a1d27',
              border: msg.role === 'assistant' ? '1px solid #2a2d3a' : 'none',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2a2d3a' }}>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Sources:</p>
                  {msg.sources.map((src, j) => (
                    <span key={j} style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: '#2a2d3a',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#4f6ef7',
                      marginRight: '4px'
                    }}>
                      📄 {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              backgroundColor: '#1a1d27',
              border: '1px solid #2a2d3a',
              fontSize: '14px',
              color: '#888'
            }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div style={{
        padding: '16px 0 24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
          rows={1}
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: '#1a1d27',
            border: '1px solid #2a2d3a',
            borderRadius: '12px',
            color: '#e0e0e0',
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            padding: '12px 20px',
            backgroundColor: input.trim() && !loading ? '#4f6ef7' : '#2a2d3a',
            color: input.trim() && !loading ? '#fff' : '#666',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap'
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default Chat