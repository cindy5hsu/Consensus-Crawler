document.addEventListener('DOMContentLoaded', () => {
    const conferenceManager = {
        apiUrl: '/api/summary/conferences-with-summaries',
        conferenceListElement: document.getElementById('conferenceList'),
        summarySection: document.getElementById('summarySection'),
        loadingElement: null,
        errorElement: null,
        conferences: [],
        
        init() {
            this.createLoadingElement();
            this.createErrorElement();
            this.fetchConferences();
            
            // 搜索功能
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => this.handleSearch());
            }
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleSearch();
                    }
                });
            }
            
            // 類別過濾功能
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', () => this.handleCategoryFilter());
            }
        },
        
        createLoadingElement() {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'text-center py-4 text-muted';
            this.loadingElement.innerHTML = `
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">載入中...</span>
                </div>
                <p class="mt-2">正在載入研討會資料...</p>
            `;
        },
        
        createErrorElement() {
            this.errorElement = document.createElement('div');
            this.errorElement.className = 'alert alert-danger my-3';
            this.errorElement.role = 'alert';
        },
        
        showLoading() {
            if (this.conferenceListElement) {
                this.conferenceListElement.innerHTML = '';
                this.conferenceListElement.appendChild(this.loadingElement);
            }
        },
        
        showError(message) {
            if (this.conferenceListElement) {
                this.errorElement.innerHTML = `
                    <div class="d-flex align-items-center">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        ${message}
                    </div>
                `;
                this.conferenceListElement.innerHTML = '';
                this.conferenceListElement.appendChild(this.errorElement);
            }
        },
        
        async fetchConferences() {
            this.showLoading();
            
            try {
                const response = await fetch(this.apiUrl);
                const data = await response.json();
                
                if (data.success) {
                    this.conferences = data.data;
                    this.renderConferences(this.conferences);
                    
                    // 如果使用的是模擬數據，顯示提示
                    if (data.message && data.message.includes('模擬數據')) {
                        const alertElement = document.createElement('div');
                        alertElement.className = 'alert alert-warning mb-3';
                        alertElement.innerHTML = `
                            <i class="bi bi-info-circle-fill me-2"></i>
                            ${data.message}
                        `;
                        this.conferenceListElement.prepend(alertElement);
                    }
                } else {
                    this.showError(data.message || '獲取研討會資料失敗');
                }
            } catch (error) {
                console.error('獲取研討會資料錯誤:', error);
                this.showError('無法連接到伺服器，請檢查網絡連接或稍後再試');
            }
        },
        
        renderConferences(conferences) {
            if (!this.conferenceListElement) return;
            
            this.conferenceListElement.innerHTML = '';
            
            if (conferences.length === 0) {
                this.conferenceListElement.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        沒有找到研討會資料
                    </div>
                `;
                return;
            }
            
            // 使用列表布局渲染研討會
            conferences.forEach(conference => {
                const listItem = document.createElement('a');
                listItem.className = 'list-group-item list-group-item-action';
                listItem.href = '#';
                listItem.dataset.id = conference.id;
                
                // 獲取摘要主要觀點，如果不存在則使用預設值
                const mainIdea = conference.summary && conference.summary.mainIdea
                    ? conference.summary.mainIdea
                    : `探討${conference.category || 'Web3'}領域的創新與挑戰`;
                
                listItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${conference.title}</h5>
                    </div>
                    <span class="badge bg-primary">${conference.category || '未分類'}</span>
                `;
                
                listItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showConferenceSummary(conference);
                    
                    // 移除其他項目的活動狀態並添加到當前項目
                    document.querySelectorAll('.list-group-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    listItem.classList.add('active');
                });
                
                this.conferenceListElement.appendChild(listItem);
            });
            
            // 如果有研討會，默認顯示第一個
            if (conferences.length > 0) {
                const firstItem = this.conferenceListElement.querySelector('.list-group-item');
                if (firstItem) {
                    firstItem.classList.add('active');
                    this.showConferenceSummary(conferences[0]);
                }
            }
        },
 
        showConferenceSummary(conference) {
            if (!this.summarySection) return;
        
            // 建立預設摘要結構
            const summary = conference.summary || {
                mainIdea: `探討${conference.category || 'Web3'}領域的創新與挑戰`,
                keyPoints: ['這是一個關於Web3技術的研討會', '討論了區塊鏈的應用場景'],
                conclusion: '區塊鏈技術將改變未來產業'
            };
        
            // 主觀點使用 marked 轉為 HTML
            const mainIdeaHtml = marked.parse(summary.mainIdea || '');
        
            // 支援兩種格式的關鍵點
            let keyPointsHtml = '<p>無關鍵點資料</p>';
            if (Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0) {
                if (typeof summary.keyPoints[0] === 'object' && summary.keyPoints[0].content) {
                    // 新格式：[{ content: '...' }]
                    keyPointsHtml = `<ul>${summary.keyPoints.map(p => `<li>${marked.parse(p.content || '')}</li>`).join('')}</ul>`;
                } else {
                    // 舊格式：['...']
                    keyPointsHtml = `<ul>${summary.keyPoints.map(p => `<li>${marked.parse(p)}</li>`).join('')}</ul>`;
                }
            }
        
            const conclusionHtml = marked.parse(summary.conclusion || '');
        
            // 渲染 UI
            this.summarySection.innerHTML = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0">${conference.title}</h4>
                    </div>
                    <div class="card-body">
                        <div class="mb-4">
                            <h5><i class="bi bi-tag me-2"></i>類別</h5>
                            <span class="badge bg-primary fs-6">${conference.category || '未分類'}</span>
                        </div>
        
                        <hr>
        
                        <div class="mb-4">
                            <h5><i class="bi bi-lightbulb me-2"></i>主要觀點</h5>
                            <div class="summary-content">${mainIdeaHtml}</div>
                        </div>
        
                        <div class="mb-4">
                            <h5><i class="bi bi-list-check me-2"></i>關鍵點</h5>
                            <div class="summary-content">${keyPointsHtml}</div>
                        </div>
        
                        <div class="mb-4">
                            <h5><i class="bi bi-flag me-2"></i>結論</h5>
                            <div class="summary-content">${conclusionHtml}</div>
                        </div>
        
                        ${conference.video_url ? `
                        <div class="mb-4">
                            <h5><i class="bi bi-camera-video me-2"></i>研討會影片</h5>
                            <div class="summary-content">
                                <a href="${conference.video_url}" target="_blank" class="btn btn-outline-success">
                                    <i class="bi bi-play-btn me-2"></i>觀看影片
                                </a>
                            </div>
                        </div>` : ''}
        
                        ${conference.transcript ? `
                        <div class="mb-4">
                            <h5><i class="bi bi-file-earmark-text me-2"></i>逐字稿</h5>
                            <div class="summary-content position-relative">
                                    <pre class="bg-light p-3 rounded" style="
                                    max-height: 400px;
                                    overflow-y: auto;
                                    overflow-x: hidden;
                                    white-space: pre-wrap;
                                    font-size: 0.95rem;
                                    line-height: 1.5;
                                ">${conference.transcript}</pre>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            `;
        },
        
        
        handleSearch() {
            const searchInput = document.getElementById('searchInput');
            if (!searchInput) return;
            
            const searchTerm = searchInput.value.trim();
            if (searchTerm === '') {
                this.renderConferences(this.conferences);
                return;
            }
            
            // 前端搜索
            const filteredConferences = this.conferences.filter(conference => {
                const searchFields = [
                    conference.title,
                    conference.speaker,
                    conference.organization,
                    conference.category,
                    conference.summary?.mainIdea,
                    ...(conference.summary?.keyPoints || []),
                    conference.summary?.conclusion
                ].filter(Boolean).join(' ').toLowerCase();
                
                return searchFields.includes(searchTerm.toLowerCase());
            });
            
            this.renderConferences(filteredConferences);
        },
        
        handleCategoryFilter() {
            const categoryFilter = document.getElementById('categoryFilter');
            if (!categoryFilter) return;
            
            const selectedCategory = categoryFilter.value;
            if (selectedCategory === 'all') {
                this.renderConferences(this.conferences);
                return;
            }
            
            // 按類別過濾
            const filteredConferences = this.conferences.filter(conference => 
                conference.category === selectedCategory
            );
            
            this.renderConferences(filteredConferences);
        }
    };

    // 初始化研討會管理器
    conferenceManager.init();
});