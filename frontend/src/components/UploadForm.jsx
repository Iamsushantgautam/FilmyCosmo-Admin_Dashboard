import React, { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function UploadForm({ token, onUploaded }) {
  const [title, setTitle] = useState('');
  const [description,setDescription] = useState('');
  const [year,setYear] = useState('');
  const [tags,setTags] = useState('');
  const [poster, setPoster] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [downloadLinks, setDownloadLinks] = useState([]);

  const addDownloadLink = () => {
    setDownloadLinks([...downloadLinks, { label: '', url: '' }]);
  };

  const removeDownloadLink = (index) => {
    setDownloadLinks(downloadLinks.filter((_, i) => i !== index));
  };

  const updateDownloadLink = (index, field, value) => {
    setDownloadLinks(downloadLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const submit = async e => {
    e.preventDefault();
    if (!title || !poster) return alert('Title and poster required');

    const formData = new FormData();
    formData.append('movie_name', title);
    formData.append('movie_description', description);
    if (year) formData.append('movie_year', year);
    if (tags) formData.append('movie_tags', tags);

    formData.append('poster', poster);
    for (let i = 0; i < screenshots.length; i++) {
      formData.append('screenshots', screenshots[i]);
    }

    // Add download links if any
    if (downloadLinks.length > 0) {
      const validLinks = downloadLinks.filter(link => link.label && link.url);
      if (validLinks.length > 0) {
        formData.append('download_links', JSON.stringify(validLinks));
      }
    }

    try {
      const res = await axios.post(`${API}/movies`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token
        }
      });
      onUploaded(res.data);
      setTitle(''); setDescription(''); setYear(''); setTags(''); 
      setPoster(null); setScreenshots([]); setDownloadLinks([]);
      alert('Movie uploaded successfully');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Upload failed');
    }
  };

  return (
    <form onSubmit={submit} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
      <br />
      <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <br />
      <input placeholder="Year" value={year} onChange={e=>setYear(e.target.value)} />
      <br />
      <input placeholder="Tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)} />
      <br />
      <label>Poster (single)</label>
      <input type="file" accept="image/*" onChange={e=>setPoster(e.target.files[0])} required />
      <br />
      <label>Screenshots (multiple)</label>
      <input type="file" accept="image/*" multiple onChange={e=>setScreenshots(e.target.files)} />
      <br />
      
      <div className="download-links-section">
        <h4>Download Links</h4>
        {downloadLinks.map((link, index) => (
          <div key={index} className="download-link-item">
            <input
              type="text"
              placeholder="Source (e.g., Google Drive, Direct Link)"
              value={link.label || ''}
              onChange={(e) => updateDownloadLink(index, 'label', e.target.value)}
            />
            <input
              type="url"
              placeholder="Download URL"
              value={link.url || ''}
              onChange={(e) => updateDownloadLink(index, 'url', e.target.value)}
            />
            <button 
              type="button"
              onClick={() => removeDownloadLink(index)}
              className="remove-link-btn"
            >
              Delete Section
            </button>
          </div>
        ))}
        <button 
          type="button"
          onClick={addDownloadLink}
          className="add-link-btn"
        >
          + Add Link
        </button>
      </div>

      <br />
      <button type="submit">Upload Movie</button>
    </form>
  );
}
