const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/leadsquared/lead', async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    email,
    message,
    source,
    leadSource,
    location
  } = req.body || {};

  if (!firstName || !phone) {
    return res.status(400).json({ ok: false, error: 'Missing required fields: firstName and phone are required' });
  }

  const accessKey = process.env.LSQ_ACCESS_KEY;
  const secretKey = process.env.LSQ_SECRET_KEY;
  const baseUrl = 'https://api-in21.leadsquared.com';

  if (!accessKey || !secretKey) {
    return res.status(500).json({ ok: false, error: 'LeadSquared credentials not configured' });
  }

  const url = `${baseUrl}/v2/LeadManagement.svc/Lead.Create?accessKey=${encodeURIComponent(accessKey)}&secretKey=${encodeURIComponent(secretKey)}`;

  const resolvedSource =
    (leadSource || source || location || '').toString().trim() || 'Google ads';

  const payload = [
    { Attribute: 'FirstName', Value: firstName },
    { Attribute: 'Phone', Value: phone },
    { Attribute: 'Source', Value: resolvedSource }
  ];

  if (lastName && lastName.trim() !== '') {
    payload.push({ Attribute: 'LastName', Value: lastName });
  }

  if (email && email.trim() !== '') {
    payload.push({ Attribute: 'EmailAddress', Value: email });
  }

  if (message && message.trim() !== '') {
    payload.push({ Attribute: 'Notes', Value: message });
  }

  try {
    const lsqResp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    return res.json({ ok: true, data: lsqResp.data });
  } catch (err) {
    const data = err.response?.data || { message: err.message };
    const exceptionType = data?.ExceptionType || '';

    if (exceptionType === 'MXDuplicateEntryException') {
      return res.json({ ok: true, duplicate: true, error: data });
    }

    const status = err.response?.status || 500;
    return res.status(status).json({ ok: false, error: data });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});



