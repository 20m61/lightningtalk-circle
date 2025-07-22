import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async(req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/presentations');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `presentation-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow PDF, PowerPoint, and common image formats
  const allowedMimes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PowerPoint, and images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/presentations - List all presentations with filtering
router.get('/', async(req, res) => {
  try {
    const { database } = req.app.locals;
    const {
      tags,
      presenter,
      search,
      skill_level,
      has_materials,
      has_video,
      sort = 'date_desc',
      limit = 20,
      offset = 0
    } = req.query;

    let presentations = (await database.findAll('presentations')) || [];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      presentations = presentations.filter(
        p =>
          p.title.toLowerCase().includes(searchLower) ||
          p.abstract.toLowerCase().includes(searchLower) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      presentations = presentations.filter(
        p => p.tags && tagArray.some(tag => p.tags.includes(tag))
      );
    }

    if (presenter) {
      presentations = presentations.filter(p =>
        p.presenter.toLowerCase().includes(presenter.toLowerCase())
      );
    }

    if (skill_level) {
      presentations = presentations.filter(p => p.skillLevel === skill_level);
    }

    if (has_materials === 'true') {
      presentations = presentations.filter(p => p.materials && p.materials.length > 0);
    }

    if (has_video === 'true') {
      presentations = presentations.filter(p => p.videoUrl);
    }

    // Apply sorting
    switch (sort) {
    case 'date_desc':
      presentations.sort((a, b) => new Date(b.presentationDate) - new Date(a.presentationDate));
      break;
    case 'date_asc':
      presentations.sort((a, b) => new Date(a.presentationDate) - new Date(b.presentationDate));
      break;
    case 'title':
      presentations.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'popularity':
      presentations.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
    }

    // Apply pagination
    const startIndex = parseInt(offset);
    const pageSize = parseInt(limit);
    const paginatedPresentations = presentations.slice(startIndex, startIndex + pageSize);

    res.json({
      presentations: paginatedPresentations,
      total: presentations.length,
      limit: pageSize,
      offset: startIndex,
      filters: {
        tags,
        presenter,
        search,
        skill_level,
        has_materials,
        has_video,
        sort
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching presentations:', error);
    res.status(500).json({
      error: 'Failed to fetch presentations',
      message: 'プレゼンテーション一覧の取得に失敗しました',
      details: error.message
    });
  }
});

// GET /api/presentations/:id - Get specific presentation
router.get('/:id', async(req, res) => {
  try {
    const { database } = req.app.locals;
    const { id } = req.params;

    const presentation = await database.findById('presentations', id);

    if (!presentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'プレゼンテーションが見つかりません'
      });
    }

    // Increment view count
    presentation.views = (presentation.views || 0) + 1;
    await database.update('presentations', id, presentation);

    // Record interaction for analytics
    const interaction = {
      id: uuidv4(),
      presentationId: id,
      interactionType: 'view',
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    };

    await database.create('presentation_interactions', interaction);

    res.json({
      presentation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching presentation:', error);
    res.status(500).json({
      error: 'Failed to fetch presentation',
      message: 'プレゼンテーション詳細の取得に失敗しました',
      details: error.message
    });
  }
});

// POST /api/presentations - Create new presentation
router.post('/', upload.array('materials', 5), async(req, res) => {
  try {
    const { database } = req.app.locals;
    const {
      title,
      presenter,
      eventId,
      abstract,
      videoUrl,
      tags,
      presentationDate,
      duration,
      skillLevel
    } = req.body;

    // Validate required fields
    if (!title || !presenter || !abstract) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'タイトル、発表者、概要は必須項目です',
        required: ['title', 'presenter', 'abstract']
      });
    }

    // Process uploaded files
    const materials = req.files
      ? req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      }))
      : [];

    // Create presentation object
    const presentation = {
      id: uuidv4(),
      title,
      presenter,
      eventId: eventId || null,
      abstract,
      materials,
      videoUrl: videoUrl || null,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      presentationDate: presentationDate || new Date().toISOString(),
      duration: duration ? parseInt(duration) : 5,
      skillLevel: skillLevel || 'beginner',
      views: 0,
      featured: false,
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await database.create('presentations', presentation);

    res.status(201).json({
      message: 'Presentation created successfully',
      message_ja: 'プレゼンテーションが正常に作成されました',
      presentation: {
        ...presentation,
        materials: presentation.materials.map(m => ({
          ...m,
          downloadUrl: `/api/presentations/${presentation.id}/materials/${m.filename}`
        }))
      }
    });
  } catch (error) {
    console.error('Error creating presentation:', error);
    res.status(500).json({
      error: 'Failed to create presentation',
      message: 'プレゼンテーションの作成に失敗しました',
      details: error.message
    });
  }
});

// PATCH /api/presentations/:id - Update presentation
router.patch('/:id', upload.array('materials', 5), async(req, res) => {
  try {
    const { database } = req.app.locals;
    const { id } = req.params;

    const existingPresentation = await database.findById('presentations', id);
    if (!existingPresentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'プレゼンテーションが見つかりません'
      });
    }

    const updateData = { ...req.body };

    // Process new uploaded files
    if (req.files && req.files.length > 0) {
      const newMaterials = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      }));

      updateData.materials = [...(existingPresentation.materials || []), ...newMaterials];
    }

    // Process tags
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim());
    }

    updateData.updatedAt = new Date().toISOString();

    const updatedPresentation = { ...existingPresentation, ...updateData };
    await database.update('presentations', id, updatedPresentation);

    res.json({
      message: 'Presentation updated successfully',
      message_ja: 'プレゼンテーションが正常に更新されました',
      presentation: updatedPresentation
    });
  } catch (error) {
    console.error('Error updating presentation:', error);
    res.status(500).json({
      error: 'Failed to update presentation',
      message: 'プレゼンテーションの更新に失敗しました',
      details: error.message
    });
  }
});

// GET /api/presentations/:id/materials/:filename - Download material
router.get('/:id/materials/:filename', async(req, res) => {
  try {
    const { database } = req.app.locals;
    const { id, filename } = req.params;

    const presentation = await database.findById('presentations', id);
    if (!presentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'プレゼンテーションが見つかりません'
      });
    }

    const material = presentation.materials?.find(m => m.filename === filename);
    if (!material) {
      return res.status(404).json({
        error: 'Material not found',
        message: '資料が見つかりません'
      });
    }

    const filePath = path.join(__dirname, '../uploads/presentations', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: 'File not found',
        message: 'ファイルが見つかりません'
      });
    }

    // Record download interaction
    const interaction = {
      id: uuidv4(),
      presentationId: id,
      interactionType: 'download',
      materialFilename: filename,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    };

    await database.create('presentation_interactions', interaction);

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${material.originalName}"`);
    res.setHeader('Content-Type', material.mimetype);

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading material:', error);
    res.status(500).json({
      error: 'Failed to download material',
      message: '資料のダウンロードに失敗しました',
      details: error.message
    });
  }
});

// GET /api/presentations/related/:id - Get related presentations
router.get('/related/:id', async(req, res) => {
  try {
    const { database } = req.app.locals;
    const { id } = req.params;

    const presentation = await database.findById('presentations', id);
    if (!presentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'プレゼンテーションが見つかりません'
      });
    }

    let allPresentations = (await database.findAll('presentations')) || [];

    // Remove current presentation
    allPresentations = allPresentations.filter(p => p.id !== id);

    // Calculate relevance scores
    const relatedPresentations = allPresentations.map(p => {
      let score = 0;

      // Tag similarity
      const commonTags = (presentation.tags || []).filter(tag => (p.tags || []).includes(tag));
      score += commonTags.length * 3;

      // Same presenter
      if (p.presenter === presentation.presenter) {
        score += 5;
      }

      // Same event
      if (p.eventId === presentation.eventId && presentation.eventId) {
        score += 2;
      }

      // Same skill level
      if (p.skillLevel === presentation.skillLevel) {
        score += 1;
      }

      return { ...p, relevanceScore: score };
    });

    // Sort by relevance and take top 5
    const topRelated = relatedPresentations
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    res.json({
      related: topRelated,
      total: topRelated.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching related presentations:', error);
    res.status(500).json({
      error: 'Failed to fetch related presentations',
      message: '関連プレゼンテーションの取得に失敗しました',
      details: error.message
    });
  }
});

export default router;
