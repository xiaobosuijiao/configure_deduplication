// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const processBtn = document.getElementById('process-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const exampleBtn = document.getElementById('example-btn');
    const exportBtn = document.getElementById('export-btn');
    const keywordsInput = document.getElementById('keywords');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    // 统计元素
    const inputLineCount = document.getElementById('input-line-count');
    const outputLineCount = document.getElementById('output-line-count');
    const processTime = document.getElementById('process-time');
    const originalBlocks = document.getElementById('original-blocks');
    const keptBlocks = document.getElementById('kept-blocks');
    const removedBlocks = document.getElementById('removed-blocks');
    
    // 更新行数统计
    function updateLineCounts() {
        const inputLines = inputText.value.split('\n').length;
        const outputLines = outputText.value.split('\n').length;
        inputLineCount.textContent = inputLines;
        outputLineCount.textContent = outputLines;
    }
    
    // 显示通知
    function showNotification(message, isError = false) {
        notificationText.textContent = message;
        
        const icon = notification.querySelector('i');
        icon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        
        notification.classList.remove('notification-error');
        if (isError) {
            notification.classList.add('notification-error');
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // 核心去重算法 - 简洁高效版本
    function removeDuplicateBlocks(text, keywords) {
        const startTime = performance.now();
        
        // 清理关键字
        const keywordList = keywords.split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
        
        if (keywordList.length === 0) {
            keywordList.push('controller', 'router', 'interface');
        }
        
        // 将文本分割为行
        const lines = text.split('\n');
        const blocks = [];
        const blockMap = new Map(); // 用于去重
        
        let currentBlock = [];
        let currentBlockKey = '';
        let inBlock = false;
        let totalBlocks = 0;
        
        // 遍历每一行
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // 检查是否是新块的开始
            const isBlockStart = keywordList.some(keyword => trimmedLine.startsWith(keyword));
            
            if (isBlockStart) {
                totalBlocks++;
                
                // 如果已经有正在收集的块，先处理它
                if (inBlock && currentBlock.length > 0) {
                    const normalizedKey = currentBlock.join('\n').trim();
                    
                    // 如果这个块还没有出现过，保存它
                    if (!blockMap.has(normalizedKey)) {
                        blockMap.set(normalizedKey, [...currentBlock]);
                    }
                    
                    // 重置当前块
                    currentBlock = [];
                    currentBlockKey = '';
                }
                
                // 开始新块
                inBlock = true;
                currentBlock.push(line);
                currentBlockKey = line.trim();
            } else if (inBlock) {
                // 继续收集当前块
                currentBlock.push(line);
                
                // 如果遇到空行，检查是否是块的结束
                if (trimmedLine === '') {
                    // 检查下一行是否是新块的开始
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1].trim();
                        const isNextBlockStart = keywordList.some(keyword => nextLine.startsWith(keyword));
                        
                        // 如果下一行是新块，则当前块结束
                        if (isNextBlockStart) {
                            const normalizedKey = currentBlock.join('\n').trim();
                            
                            if (!blockMap.has(normalizedKey)) {
                                blockMap.set(normalizedKey, [...currentBlock]);
                            }
                            
                            currentBlock = [];
                            currentBlockKey = '';
                            inBlock = false;
                        }
                    }
                }
            }
        }
        
        // 处理最后一个块（如果存在）
        if (currentBlock.length > 0) {
            const normalizedKey = currentBlock.join('\n').trim();
            if (!blockMap.has(normalizedKey)) {
                blockMap.set(normalizedKey, [...currentBlock]);
            }
        }
        
        // 构建结果 - 保持原始顺序
        const resultLines = [];
        const seenKeys = new Set();
        
        // 重新遍历原始行，按原始顺序构建结果
        let tempBlock = [];
        let tempBlockKey = '';
        let tempInBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // 检查是否是新块的开始
            const isBlockStart = keywordList.some(keyword => trimmedLine.startsWith(keyword));
            
            if (isBlockStart) {
                // 如果已经有正在收集的块，先处理它
                if (tempInBlock && tempBlock.length > 0) {
                    const key = tempBlock.join('\n').trim();
                    
                    // 如果是第一个出现的块，添加到结果中
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        resultLines.push(...tempBlock);
                    }
                    
                    // 重置临时块
                    tempBlock = [];
                    tempBlockKey = '';
                }
                
                // 开始新块
                tempInBlock = true;
                tempBlock.push(line);
                tempBlockKey = line.trim();
            } else if (tempInBlock) {
                // 继续收集当前块
                tempBlock.push(line);
                
                // 如果遇到空行，检查是否是块的结束
                if (trimmedLine === '') {
                    // 检查下一行是否是新块的开始
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1].trim();
                        const isNextBlockStart = keywordList.some(keyword => nextLine.startsWith(keyword));
                        
                        // 如果下一行是新块，则当前块结束
                        if (isNextBlockStart) {
                            const key = tempBlock.join('\n').trim();
                            
                            // 如果是第一个出现的块，添加到结果中
                            if (!seenKeys.has(key)) {
                                seenKeys.add(key);
                                resultLines.push(...tempBlock);
                            }
                            
                            tempBlock = [];
                            tempBlockKey = '';
                            tempInBlock = false;
                        }
                    }
                }
            }
        }
        
        // 处理最后一个块（如果存在）
        if (tempBlock.length > 0) {
            const key = tempBlock.join('\n').trim();
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                resultLines.push(...tempBlock);
            }
        }
        
        // 构建最终结果字符串
        const result = resultLines.join('\n');
        const endTime = performance.now();
        const timeTaken = (endTime - startTime).toFixed(2);
        
        return {
            result,
            timeTaken,
            totalBlocks,
            keptBlocks: seenKeys.size,
            removedBlocks: totalBlocks - seenKeys.size
        };
    }
    
    // 处理按钮点击事件
    processBtn.addEventListener('click', function() {
        if (!inputText.value.trim()) {
            showNotification('请输入要处理的配置文本！', true);
            return;
        }
        
        const keywords = keywordsInput.value;
        
        const processed = removeDuplicateBlocks(
            inputText.value, 
            keywords
        );
        
        outputText.value = processed.result;
        
        // 更新统计信息
        processTime.textContent = processed.timeTaken;
        originalBlocks.textContent = processed.totalBlocks;
        keptBlocks.textContent = processed.keptBlocks;
        removedBlocks.textContent = processed.removedBlocks;
        
        updateLineCounts();
        
        const message = `处理完成！删除了 ${processed.removedBlocks} 个重复块，保留了 ${processed.keptBlocks} 个唯一块。`;
        showNotification(message);
    });
    
    // 复制结果按钮点击事件
    copyBtn.addEventListener('click', function() {
        if (!outputText.value.trim()) {
            showNotification('没有可复制的内容！', true);
            return;
        }
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(outputText.value)
                .then(() => {
                    showNotification('结果已复制到剪贴板！');
                })
                .catch(err => {
                    console.error('复制失败:', err);
                    showNotification('复制失败，请手动选择复制', true);
                });
        } else {
            outputText.select();
            document.execCommand('copy');
            showNotification('结果已复制到剪贴板！');
        }
    });
    
    // 清空按钮点击事件
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        outputText.value = '';
        updateLineCounts();
        
        processTime.textContent = '0';
        originalBlocks.textContent = '0';
        keptBlocks.textContent = '0';
        removedBlocks.textContent = '0';
        
        showNotification('已清空所有内容！');
    });
    
    // 示例按钮点击事件
    exampleBtn.addEventListener('click', function() {
        const exampleText = `controller mtn-fgclient 1
 bind mtn-client 1/301 fg-timeslot 0
 work-mode satof
 fgclient-number 1
 fg-oam
  bas send enable
 !
!
controller mtn-fgclient 2
 bind mtn-client 1/301 fg-timeslot 1
 work-mode satof
 fgclient-number 2
 fg-oam
  bas send enable
 !
!
controller mtn-fgclient 1
 bind mtn-client 1/301 fg-timeslot 0
 work-mode satof
 fgclient-number 1
 fg-oam
  bas send enable
 !
!
controller mtn-fgclient 4
 bind mtn-client 1/301 fg-timeslot 3
 work-mode satof
 fgclient-number 4
 fg-oam
  bas send enable
 !
!`;
        
        inputText.value = exampleText;
        updateLineCounts();
        showNotification('已加载示例配置！');
        
        // 自动处理示例
        setTimeout(() => {
            processBtn.click();
        }, 100);
    });
    
    // 导出结果按钮点击事件
    exportBtn.addEventListener('click', function() {
        if (!outputText.value.trim()) {
            showNotification('没有可导出的内容！', true);
            return;
        }
        
        const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '去重后配置_' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('结果已导出为文本文件！');
    });
    
    // 实时更新行数统计
    inputText.addEventListener('input', updateLineCounts);
    
    // 初始化时更新行数统计
    updateLineCounts();
    
    // 自动保存功能
    let autoSaveTimer;
    inputText.addEventListener('input', function() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            localStorage.setItem('configDeduplicator_input', inputText.value);
            localStorage.setItem('configDeduplicator_keywords', keywordsInput.value);
        }, 1000);
    });
    
    // 加载保存的内容
    const savedInput = localStorage.getItem('configDeduplicator_input');
    const savedKeywords = localStorage.getItem('configDeduplicator_keywords');
    
    if (savedInput) {
        inputText.value = savedInput;
    }
    if (savedKeywords) {
        keywordsInput.value = savedKeywords;
    }
    
    // 处理示例文本
    if (savedInput) {
        setTimeout(() => {
            processBtn.click();
        }, 500);
    }
    
    // 页面加载后自动处理示例
    setTimeout(() => {
        if (!savedInput && inputText.value.trim()) {
            processBtn.click();
        }
    }, 1000);
});