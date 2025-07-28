import React, { useEffect, useState } from 'react'
import {
  Box, Button, Card, CardContent, Grid, Typography,
  TextField, Checkbox, FormControlLabel
} from '@mui/material'
import api from '../api'

export default function AdvertiserAds() {
  const [ads, setAds] = useState([])
  const [sections, setSections] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [file, setFile] = useState(null)
  const [selectedSections, setSelectedSections] = useState([])

  useEffect(() => {
    api.get('/advertiser/ads')
      .then(res => setAds(res.data))
      .catch(console.error)

    api.get('/sections')
      .then(res => setSections(res.data))
      .catch(console.error)
  }, [])

  const handleSectionChange = (key, checked) => {
    setSelectedSections(prev =>
      checked
        ? [...prev, key]
        : prev.filter(k => k !== key)
    )
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!file) {
      return alert('Please select a media file.')
    }
    const formData = new FormData()
    formData.append('media', file)
    formData.append('title', title)
    formData.append('description', description)
    formData.append('budget', budget)
    selectedSections.forEach(sec => formData.append('sections[]', sec))

    try {
      await api.post('/advertiser/ads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // refresh lists
      const [{ data: adsData }, { data: secs }] = await Promise.all([
        api.get('/advertiser/ads'),
        api.get('/sections')
      ])
      setAds(adsData)
      setSections(secs)
      setTitle(''); setDescription(''); setBudget(''); setFile(null)
      setSelectedSections([])
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }
  }

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Publish New Ad</Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        mb={4}
        sx={{ display:'grid', gap:2, maxWidth:600 }}
      >
        <TextField
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <TextField
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          multiline rows={3}
        />
        <TextField
          label="Budget"
          type="number"
          value={budget}
          onChange={e => setBudget(e.target.value)}
          required
        />
        <Box>
          <input
            type="file"
            accept="video/*"
            onChange={e => setFile(e.target.files[0])}
            required
          />
        </Box>
        <Box>
          <Typography>Assign to Sections</Typography>
          {sections.map(sec => (
            <FormControlLabel
              key={sec.key}
              control={
                <Checkbox
                  checked={selectedSections.includes(sec.key)}
                  onChange={(_, checked) =>
                    handleSectionChange(sec.key, checked)
                  }
                />
              }
              label={sec.title}
            />
          ))}
        </Box>
        <Button type="submit" variant="contained">Upload Ad</Button>
      </Box>

      <Typography variant="h5" mb={2}>Your Published Ads</Typography>
      <Grid container spacing={2}>
        {ads.map(ad => (
          <Grid item xs={12} md={6} key={ad.id}>
            <Card>
              <video
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:4001'}${ad.mediaUrl}`}
                controls style={{ width:'100%' }}
              />
              <CardContent>
                <Typography>Title: {ad.title}</Typography>
                <Typography>Views: {ad.views}</Typography>
                <Typography>Budget Spent: {ad.spent} KD</Typography>
                <Button
                  size="small"
                  onClick={() => alert(`Insights for Ad ${ad.id}`)}
                >
                  View Insights
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {ads.length===0 && <Typography>No ads yet.</Typography>}
      </Grid>
    </Box>
  )
}