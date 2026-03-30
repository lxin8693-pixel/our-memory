const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 读取数据
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// 写入数据
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API: 获取所有记忆
app.get('/api/memories', (req, res) => {
    const data = readData();
    res.json(data);
});

// API: 获取单条记忆
app.get('/api/memories/:id', (req, res) => {
    const data = readData();
    const memory = data.find(m => m.id === req.params.id);
    if (memory) {
        res.json(memory);
    } else {
        res.status(404).json({ error: '记忆不存在' });
    }
});

// API: 创建新记忆
app.post('/api/memories', (req, res) => {
    const data = readData();
    const newMemory = {
        id: Date.now().toString(),  // 用时间戳作为ID
        author: req.body.author,    // 'Lunor' 或 'Niannian'
        content: req.body.content,
        category: req.body.category || '日常',
        tags: req.body.tags || [],
        source: req.body.source || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    data.push(newMemory);
    writeData(data);
    res.json(newMemory);
});

// API: 更新记忆
app.put('/api/memories/:id', (req, res) => {
    const data = readData();
    const index = data.findIndex(m => m.id === req.params.id);
    if (index !== -1) {
        data[index] = {
            ...data[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        writeData(data);
        res.json(data[index]);
    } else {
        res.status(404).json({ error: '记忆不存在' });
    }
});

// API: 删除记忆
app.delete('/api/memories/:id', (req, res) => {
    const data = readData();
    const filtered = data.filter(m => m.id !== req.params.id);
    if (filtered.length < data.length) {
        writeData(filtered);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: '记忆不存在' });
    }
});

// API: 搜索记忆
app.get('/api/search', (req, res) => {
    const { keyword, author, category, tag } = req.query;
    let data = readData();
    
    if (keyword) {
        data = data.filter(m => 
            m.content.toLowerCase().includes(keyword.toLowerCase()) ||
            m.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase()))
        );
    }
    
    if (author) {
        data = data.filter(m => m.author === author);
    }
    
    if (category) {
        data = data.filter(m => m.category === category);
    }
    
    if (tag) {
        data = data.filter(m => m.tags.includes(tag));
    }
    
    res.json(data);
});

// API: 获取统计信息
app.get('/api/stats', (req, res) => {
    const data = readData();
    const stats = {
        total: data.length,
        byAuthor: {
            Lunor: data.filter(m => m.author === 'Lunor').length,
            Niannian: data.filter(m => m.author === 'Niannian').length
        },
        byCategory: {},
        recent: data.slice(-10).reverse()
    };
    
    data.forEach(m => {
        stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
    });
    
    res.json(stats);
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`💕 our-memory 启动成功！`);
});
