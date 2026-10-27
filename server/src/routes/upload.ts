import { Router, type Request, type Response } from 'express';
import multer from 'multer';

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const TEXT_EXT = ['.txt', '.md', '.json', '.csv', '.log'];

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

/**
 * POST /api/upload
 * 返回文件元信息；文本类文件同时提取内容（供后端拼进用户消息）。
 * 图片预览由前端用本地 objectURL 处理，不依赖此接口返回。
 */
uploadRouter.post(
  '/upload',
  upload.single('file'),
  (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: '未收到文件' });
      return;
    }

    const isText = TEXT_EXT.includes(extOf(file.originalname));
    let extractedText: string | undefined;
    if (isText) {
      extractedText = file.buffer.toString('utf-8').slice(0, 20000); // 限制长度
    }

    res.json({
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      kind: file.mimetype.startsWith('image/') ? 'image' : isText ? 'text' : 'file',
      extractedText,
    });
  },
);
