const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the project root (index.html lives here for GitHub Pages compatibility)
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`의료비 지원 시스템 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`로컬 확인: http://localhost:${PORT}`);
});

module.exports = app;
