/**
 * 文本處理工具 - 用於處理研討會文本並生成摘要
 */

const textProcessor = {
    // 從文本中提取主要內容並生成摘要報告，包含主題、講者背景、重點摘要和關鍵結論
    processSpeechText: function(text, conferenceId) {
        if (!text || text.trim() === '') {
            return {
                topic: '無法確定主題',
                speakerInfo: '無法獲取講者資訊',
                summaryPoints: [],
                conclusions: [],
                fullText: text || '',
                readingTime: 1
            };
        }

        // 保存原始文本
        const fullText = text;
        
        // 估算閱讀時間（假設平均閱讀速度為每分鐘200字）
        const wordCount = text.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));
        
        // 根據不同的會議ID使用不同的摘要策略
        // 在實際應用中，這裡應該使用NLP或LLM來生成摘要
        // 這裡我們使用預定義的摘要
        const summaries = {
            'web3-blueprint': {
                topic: 'Web3藍圖：香港作為全球Web3樞紐的戰略規劃',
                speakerInfo: 'Web3 Harbor協會代表，香港Web3產業領導者',
                summaryPoints: [
                    {
                        title: '香港Web3生態系統現狀',
                        points: [
                            'Web3 Harbor是香港地區首要的親創新、親協作的Web3行業協會',
                            '香港在虛擬資產領域具有優勢，擁有8萬億美元的資產管理規模和15,000多家機構'
                        ]
                    },
                    {
                        title: '藍圖戰略目標與實施',
                        points: [
                            '藍圖是私營部門對香港政府優先事項的承諾，旨在將香港打造為具有Web3思維的國際金融中心',
                            '藍圖關注Web3人才發展、市場架構、標準制定、技術貢獻和監管',
                            '呼籲私營部門參與私營部門主導的沙盒，以構思和測試不同的用例'
                        ]
                    },
                    {
                        title: '人才培養計劃',
                        points: [
                            'IDA創建了Web3未來領袖計劃，與香港各大學合作',
                            '致力於培養下一代Web3創新者和領導者'
                        ]
                    }
                ],
                conclusions: [
                    'Web3藍圖是香港私營部門與政府合作的重要戰略規劃',
                    '通過人才培養、標準制定和監管創新，香港有望成為全球Web3樞紐',
                    '私營部門參與對於Web3生態系統的發展至關重要'
                ]
            },
            'hong-kong-hub': {
                topic: '香港轉型為全球Web3樞紐的機遇與挑戰',
                speakerInfo: '香港金融科技專家，區塊鏈政策顧問',
                summaryPoints: [
                    {
                        title: '香港的戰略定位',
                        points: [
                            '香港正從全球金融中心轉型為全球Web3中心',
                            '利用現有金融基礎設施優勢發展區塊鏈生態系統'
                        ]
                    },
                    {
                        title: '政策與監管環境',
                        points: [
                            '政府支持區塊鏈技術和加密貨幣的發展',
                            '監管框架平衡創新與風險管理，為企業提供明確指引'
                        ]
                    },
                    {
                        title: '生態系統建設',
                        points: [
                            '吸引國際Web3企業和人才來港發展',
                            '建立完善的生態系統支持Web3創新和應用落地'
                        ]
                    }
                ],
                conclusions: [
                    '香港憑藉其金融中心地位和前瞻性政策，正積極轉型為全球Web3樞紐',
                    '平衡的監管環境是吸引全球區塊鏈企業和人才的關鍵',
                    '生態系統的完善將決定香港Web3轉型的成功'
                ]
            },
            'web3-incentives': {
                topic: '打造以使用者為核心、可擴展與公平的Web3協議架構',
                speakerInfo: 'Arvin Cain，Incentive聯合創辦人，擁有近30年技術開發經驗，致力於推動區塊鏈普及與落地應用',
                summaryPoints: [
                    {
                        title: 'Web3面臨的採用瓶頸',
                        points: [
                            '當前Layer 1/2協議存在高度中心化與激勵失衡問題',
                            '傳統UX及設計不利於大眾用戶採用',
                            '複雜的技術細節與多步驟操作提高了被攻擊風險'
                        ]
                    },
                    {
                        title: '設計出以使用者為導向的基礎協議',
                        points: [
                            '提倡預設支援帳戶抽象（Account Abstraction）',
                            '透過簡單登入方式（如指紋、臉部辨識）提升進入門檻友善度',
                            '導入一鍵操作流程，降低多步驟出錯與資產損失風險'
                        ]
                    },
                    {
                        title: '重新設計公平的激勵與參與架構',
                        points: [
                            '每個行為都應該獲得鏈上獎勵：無論是DApp開發、使用者貢獻或節點運營',
                            '藉由代幣回饋與分潤模型促進良性循環',
                            '承諾透明治理與碳排抵銷機制，兼顧環境與社會責任'
                        ]
                    }
                ],
                conclusions: [
                    'Incentive協議的設計從使用者體驗出發，強調安全、去中心化與公平分潤',
                    '期望帶動Web3大規模採用，並呼籲開發者加入測試網',
                    '參與生態系統基金申請，共同推動Web3普及'
                ]
            },
            'opening-keynote': {
                topic: '香港作為全球Web3和數字資產樞紐的發展願景',
                speakerInfo: '香港金融管理局高級代表，數字經濟政策制定者',
                summaryPoints: [
                    {
                        title: '香港作為Web3創新中心的定位',
                        points: [
                            '感謝Consensus選擇香港作為首個亞洲舉辦城市，彰顯香港作為Web3和加密創新中心的地位',
                            '香港正大力投資相關基礎設施和人才發展，數碼港和科學園已成為Web3創新和金融科技的活力中心'
                        ]
                    },
                    {
                        title: '技術融合與創新機遇',
                        points: [
                            'AI與區塊鏈的融合將創造新機遇，如信用評估、智能合約審計和投資建議',
                            '全球Web3金融應用正在增長，世界經濟論壇估計金融機構每年可通過分布式賬本技術節省約1000億美元'
                        ]
                    },
                    {
                        title: '監管框架與政策支持',
                        points: [
                            '香港已發行全球首個代幣化政府綠色債券，並建立了數字資產交易平台的許可制度',
                            '香港採取開放、公平、平衡和前瞻性的監管方法，遵循「相同活動、相同風險、相同監管」原則'
                        ]
                    }
                ],
                conclusions: [
                    '香港憑藉其穩定、開放的政策環境和前瞻性監管框架，正積極發展成為全球Web3和數字資產的重要樞紐',
                    '歡迎全球企業、機構和人才共同推動Web3生態系統發展',
                    '政府將持續優化監管環境，支持創新同時保護投資者'
                ]
            },
            'web3-art-culture': {
                topic: 'Web3藝術與文化：創新、實用性與迷因經濟的平衡',
                speakerInfo: 'Farouk，Web3文化峰會主持人，數字藝術與加密貨幣文化評論家',
                summaryPoints: [
                    {
                        title: '香港作為Web3文化樞紐',
                        points: [
                            'Consensus香港首次舉辦Web3藝術與文化峰會',
                            'Farouk認為香港是充滿活力的城市，在這裡加密貨幣不是未來而是現在'
                        ]
                    },
                    {
                        title: '行業實用性與創新',
                        points: [
                            '討論了加密貨幣行業需要更多實際應用而非僅僅新的區塊鏈',
                            '強調了媒體在加密貨幣生態系統中的重要性，包括專業新聞和創作者內容'
                        ]
                    },
                    {
                        title: '迷因經濟與投機風險',
                        points: [
                            '討論了迷因幣現象及其對行業的影響，指出「賭場是被操縱的」',
                            '呼籲支持真正的創新者和建設者，而非短期投機'
                        ]
                    }
                ],
                conclusions: [
                    '峰會強調Web3文化的重要性，呼籲行業關注實際應用開發',
                    '警惕迷因幣投機帶來的風險，支持真正的創新者和建設者',
                    '媒體和內容創作者在塑造健康Web3文化中扮演關鍵角色'
                ]
            }
        };
        
        // 如果有預定義的摘要，使用它
        if (summaries[conferenceId]) {
            return {
                topic: summaries[conferenceId].topic,
                speakerInfo: summaries[conferenceId].speakerInfo,
                summaryPoints: summaries[conferenceId].summaryPoints,
                conclusions: summaries[conferenceId].conclusions,
                fullText: fullText,
                readingTime: readingTime
            };
        }
        
        // 如果沒有預定義的摘要，生成一個基本摘要
        // 在實際應用中，這裡應該使用更複雜的NLP技術或LLM
        const sentences = text.split(/[.!?]\s+/);
        const points = [];
        
        // 選擇一些關鍵句子作為要點
        for (let i = 0; i < sentences.length && points.length < 5; i += Math.ceil(sentences.length / 5)) {
            if (sentences[i] && sentences[i].length > 20) {
                points.push(sentences[i].trim());
            }
        }
        
        // 從文本中提取可能的主題
        let possibleTopic = '';
        if (sentences.length > 0) {
            possibleTopic = sentences[0].trim();
            if (possibleTopic.length > 100) {
                possibleTopic = possibleTopic.substring(0, 97) + '...';
            }
        } else {
            possibleTopic = '無法確定主題';
        }
        
        // 從文本中提取可能的講者資訊
        let speakerInfo = '未知講者';
        // 嘗試從文本中找出講者名稱和頭銜
        const speakerRegex = /(.*?)(?:，|,)\s*(.*?)(?:，|,|\.|。|$)/;
        for (const sentence of sentences) {
            if (sentence.includes('主講') || sentence.includes('講者') || 
                sentence.includes('發言') || sentence.includes('創辦人') || 
                sentence.includes('CEO') || sentence.includes('總裁')) {
                const match = sentence.match(speakerRegex);
                if (match && match.length >= 3) {
                    speakerInfo = match[1] + '，' + match[2];
                    break;
                }
            }
        }
        
        // 將點分組為摘要段落
        const summaryPoints = [];
        if (points.length > 0) {
            // 簡單分組：每2-3個點作為一個段落
            const pointsPerSection = Math.max(1, Math.min(3, Math.ceil(points.length / 3)));
            
            const sections = [
                '主要觀點與背景',
                '關鍵技術與應用',
                '發展趨勢與挑戰'
            ];
            
            for (let i = 0; i < Math.min(3, Math.ceil(points.length / pointsPerSection)); i++) {
                const sectionPoints = [];
                for (let j = 0; j < pointsPerSection && i * pointsPerSection + j < points.length; j++) {
                    sectionPoints.push(points[i * pointsPerSection + j]);
                }
                
                if (sectionPoints.length > 0) {
                    summaryPoints.push({
                        title: sections[i] || `第${i+1}部分`,
                        points: sectionPoints
                    });
                }
            }
        }
        
        // 生成結論
        let conclusions = [];
        if (sentences.length > 5) {
            // 使用最後幾個句子作為結論
            const lastSentences = sentences.slice(Math.max(0, sentences.length - 3));
            for (const sentence of lastSentences) {
                if (sentence && sentence.length > 20) {
                    conclusions.push(sentence.trim());
                }
            }
        }
        
        if (conclusions.length === 0) {
            conclusions = ['無法從文本中提取明確結論'];
        }
        
        return {
            topic: possibleTopic,
            speakerInfo: speakerInfo,
            summaryPoints: summaryPoints.length > 0 ? summaryPoints : [{
                title: '摘要要點',
                points: ['無法從文本中提取結構化摘要']
            }],
            conclusions: conclusions,
            fullText: fullText,
            readingTime: readingTime
        };
    },
    
    // 從文件中讀取文本內容
    // 注意：在瀏覽器環境中，這個函數需要通過AJAX或Fetch API實現
    // 這裡我們假設文本內容已經通過其他方式獲取
    loadTextFromFile: function(filePath) {
        // 在實際應用中，這裡應該使用AJAX或Fetch API從服務器獲取文本
        // 這裡我們返回一個Promise，模擬異步加載
        return new Promise((resolve, reject) => {
            // 模擬加載延遲
            setTimeout(() => {
                // 在實際應用中，這裡應該是從服務器獲取的文本
                resolve('模擬從文件加載的文本內容。在實際應用中，這裡應該是從服務器獲取的文本。');
            }, 500);
        });
    },
    
    // 分類研討會內容
    categorizeContent: function(text) {
        // 在實際應用中，這裡應該使用NLP或機器學習來分類內容
        // 這裡我們使用簡單的關鍵詞匹配
        const keywords = {
            '技術': ['技術', '區塊鏈', '開發', '協議', '代碼', '智能合約', '去中心化', 'DeFi', 'NFT'],
            '趨勢': ['趨勢', '未來', '預測', '發展', '增長', '機會', '挑戰', '創新'],
            '產品': ['產品', '應用', '平台', '服務', '解決方案', '用戶體驗', 'UI', 'UX'],
            '監管': ['監管', '法規', '合規', '政策', '法律', '許可', '風險', '安全']
        };
        
        // 計算每個類別的匹配次數
        const counts = {};
        for (const category in keywords) {
            counts[category] = 0;
            for (const keyword of keywords[category]) {
                const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
                const matches = text.match(regex);
                if (matches) {
                    counts[category] += matches.length;
                }
            }
        }
        
        // 找出匹配次數最多的類別
        let maxCategory = '趨勢'; // 默認類別
        let maxCount = 0;
        for (const category in counts) {
            if (counts[category] > maxCount) {
                maxCount = counts[category];
                maxCategory = category;
            }
        }
        
        return maxCategory;
    }
};

// 如果在Node.js環境中，導出模塊
if (typeof module !== 'undefined' && module.exports) {
    module.exports = textProcessor;
}