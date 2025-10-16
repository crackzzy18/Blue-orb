module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const envUser = process.env.ADMIN_USER || 'kehnmarv';
  const envPass = process.env.ADMIN_PASS || '#Dronestech2021';
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }
  const b64 = authHeader.split(' ')[1];
  const creds = Buffer.from(b64, 'base64').toString('utf8');
  const [user, pass] = creds.split(':');
  if (user === envUser && pass === envPass) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).json({ ok:false, error:'Unauthorized' });
};
