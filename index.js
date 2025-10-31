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
  const { firstName, lastName, phone, email, message } = req.body || {};

  if (!firstName || !lastName || !phone || !email) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  const accessKey = process.env.LSQ_ACCESS_KEY;
  const secretKey = process.env.LSQ_SECRET_KEY;
  const baseUrl = 'https://api-in21.leadsquared.com';

  if (!accessKey || !secretKey) {
    return res.status(500).json({ ok: false, error: 'LeadSquared credentials not configured' });
  }

  const url = `${baseUrl}/v2/LeadManagement.svc/Lead.Create?accessKey=${encodeURIComponent(accessKey)}&secretKey=${encodeURIComponent(secretKey)}`;

  const payload = [
    { Attribute: 'FirstName', Value: firstName },
    { Attribute: 'LastName', Value: lastName },
    { Attribute: 'EmailAddress', Value: email },
    { Attribute: 'Phone', Value: phone },
    { Attribute: 'Source', Value: 'Google ads' },
    { Attribute: 'Notes', Value: message || '' }
  ];

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



