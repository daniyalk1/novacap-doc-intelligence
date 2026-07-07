import { useState } from 'react'
import axios from 'axios'

const API = 'https://novacap-backend.bravebeach-bb6dfe67.eastus.azurecontainerapps.io'

function Upload() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setStatus('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post(`${API}/api/upload`, formData)
      setStatus(`✓ ${res.data.message} (${res.data.chunks_indexed} chunks indexed)`)
      setUploadedFiles(prev => [...prev, file.name])
      setFile(null)
    } catch (err) {
      setStatus(`✗ Upload failed: ${err.response?.data?.detail || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '48px auto',
      padding: '0 24px'
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
        Upload Document
      </h2>

      <div style={{
        border: '2px dashed #2a2d3a',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#1a1d27',
        marginBottom: '16px'
      }}>
        <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>
          Supports PDF and TXT files
        </p>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={e => setFile(e.target.files[0])}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" style={{
          padding: '10px 20px',
          backgroundColor: '#2a2d3a',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#ccc'
        }}>
          Choose File
        </label>
        {file && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#4f6ef7' }}>
            {file.name}
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: file && !loading ? '#4f6ef7' : '#2a2d3a',
          color: file && !loading ? '#fff' : '#666',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '500',
          cursor: file && !loading ? 'pointer' : 'not-allowed'
        }}
      >
        {loading ? 'Uploading...' : 'Upload & Index'}
      </button>

      {status && (
        <p style={{
          marginTop: '16px',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          backgroundColor: status.startsWith('✓') ? '#1a2a1a' : '#2a1a1a',
          color: status.startsWith('✓') ? '#4caf50' : '#f44336'
        }}>
          {status}
        </p>
      )}

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
            Uploaded this session
          </h3>
          {uploadedFiles.map((name, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              backgroundColor: '#1a1d27',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '6px',
              border: '1px solid #2a2d3a'
            }}>
              📄 {name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Upload