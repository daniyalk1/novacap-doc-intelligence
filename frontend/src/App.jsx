import { useState } from 'react'
import Upload from './components/Upload'
import Chat from './components/Chat'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{
        backgroundColor: '#1a1d27',
        padding: '16px 24px',
        borderBottom: '1px solid #2a2d3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff' }}>
            NovaCap Document Intelligence
          </h1>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
            Ask questions about your internal documents
          </p>
        </div>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {['chat', 'upload'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                backgroundColor: activeTab === tab ? '#4f6ef7' : '#2a2d3a',
                color: activeTab === tab ? '#fff' : '#aaa',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'chat' ? <Chat /> : <Upload />}
      </main>
    </div>
  )
}

export default App