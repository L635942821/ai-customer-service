import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat.js';
import { uploadRouter } from './routes/upload.js';
import { PROMPT_TEMPLATES } from './prompts/system.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '15mb' })); // 容纳图片 dataURL

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/prompts', (_req, res) => res.json(PROMPT_TEMPLATES));

app.use('/api', chatRouter);
app.use('/api', uploadRouter);

app.listen(PORT, () => {
  console.log(`✅ AI 客服后端已启动: http://localhost:${PORT}`);
});
