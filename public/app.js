// ===== 全局变量 =====
let allMemories = [];

// ===== DOM 元素 =====
const memoryList = document.getElementById('memory-list');
const statTotal = document.getElementById('stat-total');
const statLunor = document.getElementById('stat-lunor');
const statNiannian = document.getElementById('stat-niannian');
const btnAddNew = document.getElementById('btn-add-new');
const searchInput = document.getElementById('search-input');
const memoryModal = document.getElementById('memory-modal');
const closeModal = document.getElementById('close-modal');
const memoryForm = document.getElementById('memory-form');
const btnCancel = document.getElementById('btn-cancel');
const modalTitle = document.getElementById('modal-title');

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    loadMemories();
    loadStats();
});

// ===== 加载所有记忆 =====
async function loadMemories() {
    try {
        const response = await fetch('/api/memories');
        allMemories = await response.json();
        renderMemories(allMemories);
    } catch (error) {
        console.error('加载记忆失败:', error);
        alert('加载记忆失败，请刷新页面');
    }
}

// ===== 渲染记忆列表 =====
function renderMemories(memories) {
    memoryList.innerHTML = '';
    
    if (memories.length === 0) {
        memoryList.innerHTML = '<p class="empty-state">还没有记忆，快写第一条吧！✨</p >';
        return;
    }
    
    // 按时间倒序排列
    const sorted = [...memories].reverse();
    
    sorted.forEach(memory => {
        const card = createMemoryCard(memory);
        memoryList.appendChild(card);
    });
}

// ===== 创建记忆卡片 =====
function createMemoryCard(memory) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.id = memory.id;
    
    const date = new Date(memory.createdAt).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const tagsHtml = memory.tags && memory.tags.length > 0
        ? memory.tags.map(tag => `<span class="tag">#${tag.trim()}</span>`).join('')
        : '';
    
    card.innerHTML = `
        <div class="memory-header">
            <span class="memory-author ${memory.author}">${memory.author}</span>
            <span class="memory-meta">📅 ${date}</span>
        </div>
        <div class="memory-content">${escapeHtml(memory.content)}</div>
        <div class="memory-meta">
            <span>📁 ${memory.category}</span>
            ${memory.source ? `<span>📎 ${escapeHtml(memory.source)}</span>` : ''}
        </div>
        ${tagsHtml ? `<div class="memory-tags">${tagsHtml}</div>` : ''}
        <div class="memory-actions">
            <button class="btn btn-sm btn-secondary" onclick="editMemory('${memory.id}')">✏️ 编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMemory('${memory.id}')">🗑️ 删除</button>
        </div>
    `;
    
    return card;
}

// ===== 加载统计信息 =====
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        statTotal.textContent = stats.total;
        statLunor.textContent = stats.byAuthor.Lunor;
        statNiannian.textContent = stats.byAuthor.Niannian;
    } catch (error) {
        console.error('加载统计失败:', error);
    }
}

// ===== 打开新增弹窗 =====
btnAddNew.addEventListener('click', () => {
    resetForm();
    modalTitle.textContent = '写新记忆';
    memoryModal.classList.add('active');
});

// ===== 关闭弹窗 =====
closeModal.addEventListener('click', () => {
    memoryModal.classList.remove('active');
});

btnCancel.addEventListener('click', () => {
    memoryModal.classList.remove('active');
});

// 点击弹窗外部关闭
memoryModal.addEventListener('click', (e) => {
    if (e.target === memoryModal) {
        memoryModal.classList.remove('active');
    }
});

// ===== 重置表单 =====
function resetForm() {
    document.getElementById('memory-id').value = '';
    document.getElementById('memory-author').value = 'Lunor';
    document.getElementById('memory-category').value = '日常';
    document.getElementById('memory-tags').value = '';
    document.getElementById('memory-source').value = '';
    document.getElementById('memory-content').value = '';
}

// ===== 提交表单（新增或编辑）=====
memoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('memory-id').value;
    const data = {
        author: document.getElementById('memory-author').value,
        category: document.getElementById('memory-category').value,
        tags: document.getElementById('memory-tags').value.split(',').map(t => t.trim()).filter(t => t),
        source: document.getElementById('memory-source').value,
        content: document.getElementById('memory-content').value
    };
    
    try {
        let response;
        if (id) {
            // 编辑
            response = await fetch(`/api/memories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // 新增
            response = await fetch('/api/memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            memoryModal.classList.remove('active');
            loadMemories();
            loadStats();
            alert(id ? '记忆已更新！' : '新记忆已保存！');
        } else {
            alert('保存失败，请重试');
        }
    } catch (error) {
        console.error('保存记忆失败:', error);
        alert('保存失败，请重试');
    }
});

// ===== 编辑记忆 =====
window.editMemory = async function(id) {
    try {
        const response = await fetch(`/api/memories/${id}`);
        const memory = await response.json();
        
        document.getElementById('memory-id').value = memory.id;
        document.getElementById('memory-author').value = memory.author;
        document.getElementById('memory-category').value = memory.category;
        document.getElementById('memory-tags').value = memory.tags ? memory.tags.join(', ') : '';
        document.getElementById('memory-source').value = memory.source || '';
        document.getElementById('memory-content').value = memory.content;
        
        modalTitle.textContent = '编辑记忆';
        memoryModal.classList.add('active');
    } catch (error) {
        console.error('加载记忆失败:', error);
        alert('加载记忆失败，请重试');
    }
};

// ===== 删除记忆 =====
window.deleteMemory = async function(id) {
    if (!confirm('确定要删除这条记忆吗？')) return;
    
    try {
        const response = await fetch(`/api/memories/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadMemories();
            loadStats();
            alert('记忆已删除');
        } else {
            alert('删除失败，请重试');
        }
    } catch (error) {
        console.error('删除记忆失败:', error);
        alert('删除失败，请重试');
    }
};

// ===== 搜索功能 =====
searchInput.addEventListener('input', async (e) => {
    const keyword = e.target.value.trim();
    
    if (!keyword) {
        renderMemories(allMemories);
        return;
    }
    
    try {
        const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
        const results = await response.json();
        renderMemories(results);
    } catch (error) {
        console.error('搜索失败:', error);
    }
});

// ===== HTML转义（防止XSS）=====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
