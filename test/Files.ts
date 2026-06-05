import { Rivet } from '../src/index';
import fs from 'fs/promises';
import path from 'path';

const app = new Rivet();

// Upload endpoint
app.post('/upload/:field', async (req: any, res: any) => {
    const field = req.params.field;
    const file = req.files[field];
    
    if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    
    // Save file to uploads directory
    const uploadDir = './uploads';
    await fs.mkdir(uploadDir, { recursive: true });
    
    const savePath = path.join(uploadDir, file.filename);
    await fs.writeFile(savePath, file.data);
    
    res.json({ 
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType
    });
});

// Download endpoint
app.get('/download/:filename', async (req: any, res: any) => {
    const filename = req.params.filename;
    const filePath = path.join('./uploads', filename);
    
    try {
        const file = await fs.readFile(filePath);
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`
        });
        res.end(file);
    } catch (err) {
        res.status(404).json({ error: 'File not found' });
    }
});

app.start(3000);