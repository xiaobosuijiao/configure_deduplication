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
    const blockEndInput = document.getElementById('block-end');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // 行号元素
    const inputLineNumbers = document.getElementById('input-line-numbers');
    const outputLineNumbers = document.getElementById('output-line-numbers');
    
    // 主题相关元素（稍后初始化）
    let themeIcon, themeText;
    
    // 统计元素
    const inputLineCount = document.getElementById('input-line-count');
    const outputLineCount = document.getElementById('output-line-count');
    const processTime = document.getElementById('process-time');
    const originalBlocks = document.getElementById('original-blocks');
    const keptBlocks = document.getElementById('kept-blocks');
    const removedBlocks = document.getElementById('removed-blocks');
    
    // 导出详细结果按钮和格式选择
    const exportDetailsBtn = document.getElementById('export-details-btn');
    const exportFormatSelect = document.getElementById('export-format');
    
    // 存储最后一次处理的结果
    let lastProcessedResult = null;
    
    // 更新行数统计和行号
    function updateLineCounts() {
        const inputLines = inputText.value.split('\n').length;
        const outputLines = outputText.value.split('\n').length;
        inputLineCount.textContent = inputLines;
        outputLineCount.textContent = outputLines;
        
        // 更新行号显示
        updateLineNumbers(inputText, inputLineNumbers);
        updateLineNumbers(outputText, outputLineNumbers);
    }
    
    // 更新行号显示
    function updateLineNumbers(textarea, lineNumbersElement) {
        const lines = textarea.value.split('\n').length;
        const lineNumbers = [];
        
        // 生成行号
        for (let i = 1; i <= lines; i++) {
            lineNumbers.push(`<span>${i}</span>`);
        }
        
        // 更新行号显示
        lineNumbersElement.innerHTML = lineNumbers.join('');
        
        // 同步滚动
        syncScroll(textarea, lineNumbersElement);
    }
    
    // 高亮显示将被删除的行
    function highlightRemovedLines(removedLineNumbers) {
        if (!removedLineNumbers || removedLineNumbers.length === 0) {
            return;
        }
        
        // 获取输入文本框和行号元素
        const inputText = document.getElementById('input-text');
        const inputLineNumbers = document.getElementById('input-line-numbers');
        
        if (!inputText || !inputLineNumbers) {
            return;
        }
        
        // 获取所有行
        const lines = inputText.value.split('\n');
        
        // 清除之前的高亮
        clearHighlights();
        
        // 高亮将被删除的行
        removedLineNumbers.forEach(lineNumber => {
            if (lineNumber >= 1 && lineNumber <= lines.length) {
                // 高亮行号
                const lineNumberSpans = inputLineNumbers.querySelectorAll('span');
                if (lineNumberSpans[lineNumber - 1]) {
                    lineNumberSpans[lineNumber - 1].classList.add('removed-line-number');
                }
            }
        });
        
        // 对于小文本，我们还可以在文本框中高亮显示
        if (lines.length <= 1000) {
            // 创建一个临时div来显示高亮文本
            const textareaWrapper = inputText.parentElement;
            const highlightDiv = document.createElement('div');
            highlightDiv.id = 'text-highlight-overlay';
            highlightDiv.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                background: transparent;
                z-index: 1;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.6;
                white-space: pre;
                overflow: hidden;
                padding: 20px;
                margin-left: 70px; /* 行号区域宽度 */
                color: transparent;
            `;
            
            // 构建高亮文本
            let highlightedText = '';
            for (let i = 0; i < lines.length; i++) {
                const lineNumber = i + 1;
                if (removedLineNumbers.includes(lineNumber)) {
                    // 将被删除的行：添加高亮背景
                    highlightedText += `<span class="removed-line-highlight">${lines[i] || ' '}</span>\n`;
                } else {
                    // 保留的行：透明文本
                    highlightedText += `<span style="color: transparent;">${lines[i] || ' '}</span>\n`;
                }
            }
            
            highlightDiv.innerHTML = highlightedText;
            
            // 移除旧的覆盖层（如果存在）
            const oldOverlay = document.getElementById('text-highlight-overlay');
            if (oldOverlay) {
                oldOverlay.remove();
            }
            
            // 添加新的覆盖层
            textareaWrapper.style.position = 'relative';
            textareaWrapper.appendChild(highlightDiv);
            
            // 同步滚动
            inputText.addEventListener('scroll', function() {
                highlightDiv.scrollTop = inputText.scrollTop;
                highlightDiv.scrollLeft = inputText.scrollLeft;
            });
        }
    }
    
    // 清除高亮
    function clearHighlights() {
        // 清除行号高亮
        const inputLineNumbers = document.getElementById('input-line-numbers');
        if (inputLineNumbers) {
            const lineNumberSpans = inputLineNumbers.querySelectorAll('span');
            lineNumberSpans.forEach(span => {
                span.classList.remove('removed-line-number');
            });
        }
        
        // 清除文本高亮覆盖层
        const oldOverlay = document.getElementById('text-highlight-overlay');
        if (oldOverlay) {
            oldOverlay.remove();
        }
    }
    
    // 同步文本框和行号区域的滚动
    function syncScroll(textarea, lineNumbersElement) {
        // 移除之前的滚动事件监听器（避免重复）
        textarea.removeEventListener('scroll', handleScroll);
        
        function handleScroll() {
            lineNumbersElement.scrollTop = textarea.scrollTop;
        }
        
        textarea.addEventListener('scroll', handleScroll);
    }
    
    // 初始化行号显示
    function initLineNumbers() {
        // 初始更新行号
        updateLineNumbers(inputText, inputLineNumbers);
        updateLineNumbers(outputText, outputLineNumbers);
        
        // 监听输入变化
        inputText.addEventListener('input', function() {
            updateLineNumbers(inputText, inputLineNumbers);
        });
        
        // 输出框内容变化时也更新行号
        const observer = new MutationObserver(function() {
            updateLineNumbers(outputText, outputLineNumbers);
        });
        
        observer.observe(outputText, { childList: false, characterData: true, subtree: true });
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
    
    // 核心去重算法 - 简洁高效版本（增强版，收集重复块信息）
    function removeDuplicateBlocks(text, keywords, blockEndMarker = '!') {
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
        
        // 数据结构：存储块信息和重复统计
        const blockInfoMap = new Map(); // key -> {content: [], count: 0, lineNumbers: []}
        const blockOccurrences = []; // 记录每个块的出现信息
        
        let currentBlock = [];
        let currentBlockStartLine = -1;
        let inBlock = false;
        let totalBlocks = 0;
        
        // 第一遍：识别所有块并统计信息
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // 检查是否是新块的开始
            const isBlockStart = keywordList.some(keyword => trimmedLine.startsWith(keyword));
            
            if (isBlockStart) {
                totalBlocks++;
                
                // 如果已经有正在收集的块，先处理它
                if (inBlock && currentBlock.length > 0) {
                    const blockKey = currentBlock.join('\n').trim();
                    const blockContent = [...currentBlock];
                    
                    // 记录块出现信息
                    blockOccurrences.push({
                        key: blockKey,
                        content: blockContent,
                        startLine: currentBlockStartLine + 1, // 转换为1-based行号
                        endLine: i // 当前行是下一个块的开始，所以上一个块结束于i-1
                    });
                    
                    // 更新块信息统计
                    if (!blockInfoMap.has(blockKey)) {
                        blockInfoMap.set(blockKey, {
                            content: blockContent,
                            count: 1,
                            lineNumbers: [currentBlockStartLine + 1]
                        });
                    } else {
                        const info = blockInfoMap.get(blockKey);
                        info.count++;
                        info.lineNumbers.push(currentBlockStartLine + 1);
                    }
                    
                    // 重置当前块
                    currentBlock = [];
                }
                
                // 开始新块
                inBlock = true;
                currentBlockStartLine = i;
                currentBlock.push(line);
            } else if (inBlock) {
                // 继续收集当前块
                currentBlock.push(line);
                
                // 检查是否是块的结束：遇到块结束标记时，结束当前块
                if (trimmedLine === blockEndMarker) {
                    // 查找后续所有连续的块结束标记行
                    let nextIdx = i + 1;
                    while (nextIdx < lines.length && lines[nextIdx].trim() === blockEndMarker) {
                        // 将连续的块结束标记添加到当前块中
                        currentBlock.push(lines[nextIdx]);
                        i = nextIdx; // 跳过这些行
                        nextIdx++;
                    }
                    
                    // 结束当前块（不再检查下一行）
                    const blockKey = currentBlock.join('\n').trim();
                    const blockContent = [...currentBlock];
                    
                    // 记录块出现信息
                    blockOccurrences.push({
                        key: blockKey,
                        content: blockContent,
                        startLine: currentBlockStartLine + 1,
                        endLine: i + 1 // 包括最后一行
                    });
                    
                    // 更新块信息统计
                    if (!blockInfoMap.has(blockKey)) {
                        blockInfoMap.set(blockKey, {
                            content: blockContent,
                            count: 1,
                            lineNumbers: [currentBlockStartLine + 1]
                        });
                    } else {
                        const info = blockInfoMap.get(blockKey);
                        info.count++;
                        info.lineNumbers.push(currentBlockStartLine + 1);
                    }
                    
                    currentBlock = [];
                    inBlock = false;
                }
            }
            // 注意：这里不处理非块行，因为第一遍扫描只关注块识别和统计
        }
        
        // 处理最后一个块（如果存在）
        if (currentBlock.length > 0) {
            const blockKey = currentBlock.join('\n').trim();
            const blockContent = [...currentBlock];
            
            // 记录块出现信息
            blockOccurrences.push({
                key: blockKey,
                content: blockContent,
                startLine: currentBlockStartLine + 1,
                endLine: lines.length // 最后一行
            });
            
            // 更新块信息统计
            if (!blockInfoMap.has(blockKey)) {
                blockInfoMap.set(blockKey, {
                    content: blockContent,
                    count: 1,
                    lineNumbers: [currentBlockStartLine + 1]
                });
            } else {
                const info = blockInfoMap.get(blockKey);
                info.count++;
                info.lineNumbers.push(currentBlockStartLine + 1);
            }
        }
        
        // 第二遍：构建结果，保持原始顺序，并记录将被删除的行
        const resultLines = [];
        const seenKeys = new Set();
        const removedLineNumbers = new Set(); // 记录将被删除的行号（1-based）
        
        currentBlock = [];
        let secondPassBlockStartLine = -1; // 记录当前块的起始行号（0-based），避免与第一遍的变量名冲突
        inBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // 检查是否是新块的开始
            const isBlockStart = keywordList.some(keyword => trimmedLine.startsWith(keyword));
            
            if (isBlockStart) {
                // 如果已经有正在收集的块，先处理它
                if (inBlock && currentBlock.length > 0) {
                    const key = currentBlock.join('\n').trim();
                    
                    // 如果是第一个出现的块，添加到结果中
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        resultLines.push(...currentBlock);
                    } else {
                        // 这个块是重复的，将被删除，记录所有行号
                        // 当前块的起始行号是 secondPassBlockStartLine
                        for (let j = 0; j < currentBlock.length; j++) {
                            removedLineNumbers.add(secondPassBlockStartLine + j + 1); // 转换为1-based行号
                        }
                    }
                    
                    // 重置当前块
                    currentBlock = [];
                }
                
                // 开始新块
                inBlock = true;
                secondPassBlockStartLine = i; // 记录块的起始行号
                currentBlock.push(line);
            } else if (inBlock) {
                // 继续收集当前块
                currentBlock.push(line);
                
                // 检查是否是块的结束：遇到块结束标记时，结束当前块
                if (trimmedLine === blockEndMarker) {
                    // 查找后续所有连续的块结束标记行
                    let nextIdx = i + 1;
                    while (nextIdx < lines.length && lines[nextIdx].trim() === blockEndMarker) {
                        // 将连续的块结束标记添加到当前块中
                        currentBlock.push(lines[nextIdx]);
                        i = nextIdx; // 跳过这些行
                        nextIdx++;
                    }
                    
                    // 结束当前块（不再检查下一行）
                    const key = currentBlock.join('\n').trim();
                    
                    // 如果是第一个出现的块，添加到结果中
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        resultLines.push(...currentBlock);
                    } else {
                        // 这个块是重复的，将被删除，记录所有行号
                        // 当前块的起始行号是 secondPassBlockStartLine
                        for (let j = 0; j < currentBlock.length; j++) {
                            removedLineNumbers.add(secondPassBlockStartLine + j + 1); // 转换为1-based行号
                        }
                    }
                    
                    currentBlock = [];
                    inBlock = false;
                }
            } else {
                // 不在块中的行（如"1223"这样的行）直接添加到结果中
                resultLines.push(line);
            }
        }
        
        // 处理最后一个块（如果存在）
        if (currentBlock.length > 0) {
            const key = currentBlock.join('\n').trim();
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                resultLines.push(...currentBlock);
            } else {
                // 这个块是重复的，将被删除，记录所有行号
                // 当前块的起始行号是 secondPassBlockStartLine
                for (let j = 0; j < currentBlock.length; j++) {
                    removedLineNumbers.add(secondPassBlockStartLine + j + 1); // 转换为1-based行号
                }
            }
        }
        
        // 构建最终结果字符串
        const result = resultLines.join('\n');
        const endTime = performance.now();
        const timeTaken = (endTime - startTime).toFixed(2);
        
        // 提取重复块信息
        const duplicateBlocks = [];
        for (const [key, info] of blockInfoMap.entries()) {
            if (info.count > 1) {
                duplicateBlocks.push({
                    content: info.content.join('\n'),
                    count: info.count,
                    lineNumbers: info.lineNumbers,
                    firstOccurrenceLine: info.lineNumbers[0]
                });
            }
        }
        
        // 按重复次数降序排序
        duplicateBlocks.sort((a, b) => b.count - a.count);
        
        return {
            result,
            timeTaken,
            totalBlocks,
            keptBlocks: seenKeys.size,
            removedBlocks: totalBlocks - seenKeys.size,
            duplicateBlocks,
            removedLineNumbers: Array.from(removedLineNumbers).sort((a, b) => a - b)
        };
    }
    
    // 处理按钮点击事件
    processBtn.addEventListener('click', function() {
        if (!inputText.value.trim()) {
            showNotification('请输入要处理的配置文本！', true);
            return;
        }
        
        const keywords = keywordsInput.value;
        const blockEndMarker = blockEndInput.value.trim() || '!';
        const text = inputText.value;
        
        // 检查文本大小
        const lineCount = text.split('\n').length;
        const isLargeFile = lineCount > 100000; // 超过10万行视为大文件
        
        if (isLargeFile) {
            // 使用大文本处理模式
            processLargeText(text, keywords, blockEndMarker);
        } else {
            // 使用普通处理模式
            const processed = removeDuplicateBlocks(text, keywords, blockEndMarker);
            
            outputText.value = processed.result;
            
            // 更新统计信息
            processTime.textContent = processed.timeTaken;
            originalBlocks.textContent = processed.totalBlocks;
            keptBlocks.textContent = processed.keptBlocks;
            removedBlocks.textContent = processed.removedBlocks;
            
            // 保存处理结果
            lastProcessedResult = processed;
            
            updateLineCounts();
            
            // 高亮显示将被删除的行
            if (processed.removedLineNumbers && processed.removedLineNumbers.length > 0) {
                highlightRemovedLines(processed.removedLineNumbers);
            } else {
                clearHighlights();
            }
            
            const message = `处理完成！删除了 ${processed.removedBlocks} 个重复块，保留了 ${processed.keptBlocks} 个唯一块。`;
            showNotification(message);
        }
    });
    
    // 大文本处理函数（增强版，收集重复块信息）
    function processLargeText(text, keywords, blockEndMarker = '!') {
        const startTime = performance.now();
        const lines = text.split('\n');
        const totalLines = lines.length;
        
        // 显示进度指示器
        const progressContainer = document.getElementById('progress-container');
        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');
        const progressDetail = document.getElementById('progress-detail');
        const progressPercentage = document.getElementById('progress-percentage');
        
        progressContainer.style.display = 'block';
        progressText.textContent = '正在处理大文本...';
        
        // 清理关键字
        const keywordList = keywords.split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
        
        if (keywordList.length === 0) {
            keywordList.push('controller', 'router', 'interface');
        }
        
        // 用于去重的Map和重复块信息收集
        const blockMap = new Map(); // key -> content
        const blockInfoMap = new Map(); // key -> {content: [], count: 0, lineNumbers: []}
        const blockOccurrences = []; // 记录每个块的出现信息
        
        let totalBlocks = 0;
        let currentBlock = [];
        let currentBlockStartLine = -1;
        let inBlock = false;
        
        // 分块处理参数
        const chunkSize = 10000; // 每块处理10000行
        let currentChunk = 0;
        const totalChunks = Math.ceil(totalLines / chunkSize);
        
        // 使用requestAnimationFrame进行迭代处理，避免调用堆栈溢出
        function processNextChunk() {
            const chunkStart = currentChunk * chunkSize;
            const chunkEnd = Math.min(chunkStart + chunkSize, totalLines);
            
            // 处理当前块
            for (let i = chunkStart; i < chunkEnd; i++) {
                const line = lines[i];
                const trimmedLine = line.trim();
                
                // 检查是否是新块的开始
                const isBlockStart = keywordList.some(keyword => trimmedLine.startsWith(keyword));
                
                if (isBlockStart) {
                    totalBlocks++;
                    
                    // 如果已经有正在收集的块，先处理它
                    if (inBlock && currentBlock.length > 0) {
                        const blockKey = currentBlock.join('\n').trim();
                        const blockContent = [...currentBlock];
                        
                        // 记录块出现信息
                        blockOccurrences.push({
                            key: blockKey,
                            content: blockContent,
                            startLine: currentBlockStartLine + 1,
                            endLine: i
                        });
                        
                        // 更新块信息统计
                        if (!blockInfoMap.has(blockKey)) {
                            blockInfoMap.set(blockKey, {
                                content: blockContent,
                                count: 1,
                                lineNumbers: [currentBlockStartLine + 1]
                            });
                        } else {
                            const info = blockInfoMap.get(blockKey);
                            info.count++;
                            info.lineNumbers.push(currentBlockStartLine + 1);
                        }
                        
                        // 如果这个块还没有出现过，保存到去重Map
                        if (!blockMap.has(blockKey)) {
                            blockMap.set(blockKey, blockContent);
                        }
                        
                        // 重置当前块
                        currentBlock = [];
                    }
                    
                    // 开始新块
                    inBlock = true;
                    currentBlockStartLine = i;
                    currentBlock.push(line);
                } else if (inBlock) {
                    // 继续收集当前块
                    currentBlock.push(line);
                    
                    // 检查是否是块的结束：遇到块结束标记时，结束当前块
                    if (trimmedLine === blockEndMarker) {
                        // 查找后续所有连续的块结束标记行
                        let nextIdx = i + 1;
                        while (nextIdx < lines.length && lines[nextIdx].trim() === blockEndMarker) {
                            // 将连续的块结束标记添加到当前块中
                            currentBlock.push(lines[nextIdx]);
                            i = nextIdx; // 跳过这些行
                            nextIdx++;
                        }
                        
                        // 结束当前块（不再检查下一行）
                        const blockKey = currentBlock.join('\n').trim();
                        const blockContent = [...currentBlock];
                        
                        // 记录块出现信息
                        blockOccurrences.push({
                            key: blockKey,
                            content: blockContent,
                            startLine: currentBlockStartLine + 1,
                            endLine: i + 1
                        });
                        
                        // 更新块信息统计
                        if (!blockInfoMap.has(blockKey)) {
                            blockInfoMap.set(blockKey, {
                                content: blockContent,
                                count: 1,
                                lineNumbers: [currentBlockStartLine + 1]
                            });
                        } else {
                            const info = blockInfoMap.get(blockKey);
                            info.count++;
                            info.lineNumbers.push(currentBlockStartLine + 1);
                        }
                        
                        // 如果这个块还没有出现过，保存到去重Map
                        if (!blockMap.has(blockKey)) {
                            blockMap.set(blockKey, blockContent);
                        }
                        
                        currentBlock = [];
                        inBlock = false;
                    }
                }
            }
            
            currentChunk++;
            
            // 更新进度显示
            if (progressFill && progressDetail && progressPercentage) {
                const progress = Math.min(100, Math.round((currentChunk / totalChunks) * 100));
                progressFill.style.width = `${progress}%`;
                progressDetail.textContent = `已处理 ${Math.min(currentChunk * chunkSize, totalLines).toLocaleString()} 行 / 总共 ${totalLines.toLocaleString()} 行`;
                progressPercentage.textContent = `${progress}%`;
            }
            
            // 检查是否还有更多块需要处理
            if (currentChunk < totalChunks) {
                // 使用requestAnimationFrame进行下一块处理，避免调用堆栈溢出
                requestAnimationFrame(processNextChunk);
            } else {
                // 处理最后一个块（如果存在）
                if (currentBlock.length > 0) {
                    const blockKey = currentBlock.join('\n').trim();
                    const blockContent = [...currentBlock];
                    
                    // 记录块出现信息
                    blockOccurrences.push({
                        key: blockKey,
                        content: blockContent,
                        startLine: currentBlockStartLine + 1,
                        endLine: totalLines
                    });
                    
                    // 更新块信息统计
                    if (!blockInfoMap.has(blockKey)) {
                        blockInfoMap.set(blockKey, {
                            content: blockContent,
                            count: 1,
                            lineNumbers: [currentBlockStartLine + 1]
                        });
                    } else {
                        const info = blockInfoMap.get(blockKey);
                        info.count++;
                        info.lineNumbers.push(currentBlockStartLine + 1);
                    }
                    
                    // 如果这个块还没有出现过，保存到去重Map
                    if (!blockMap.has(blockKey)) {
                        blockMap.set(blockKey, blockContent);
                    }
                }
                
                // 构建最终结果
                finishProcessing();
            }
        }
        
        function finishProcessing() {
            const endTime = performance.now();
            const timeTaken = (endTime - startTime).toFixed(2);
            
            // 构建结果字符串
            const resultLines = [];
            const seenKeys = new Set();
            
            // 重新遍历原始行，按原始顺序构建结果
            let tempBlock = [];
            let tempBlockKey = '';
            let tempInBlock = false;
            
            for (let i = 0; i < totalLines; i++) {
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
                    
                    // 检查是否是块的结束：遇到块结束标记时，结束当前块
                    if (trimmedLine === blockEndMarker) {
                        // 查找后续所有连续的块结束标记行
                        let nextIdx = i + 1;
                        while (nextIdx < lines.length && lines[nextIdx].trim() === blockEndMarker) {
                            // 将连续的块结束标记添加到当前块中
                            tempBlock.push(lines[nextIdx]);
                            i = nextIdx; // 跳过这些行
                            nextIdx++;
                        }
                        
                        // 结束当前块（不再检查下一行）
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
            
            // 提取重复块信息
            const duplicateBlocks = [];
            for (const [key, info] of blockInfoMap.entries()) {
                if (info.count > 1) {
                    duplicateBlocks.push({
                        content: info.content.join('\n'),
                        count: info.count,
                        lineNumbers: info.lineNumbers,
                        firstOccurrenceLine: info.lineNumbers[0]
                    });
                }
            }
            
            // 按重复次数降序排序
            duplicateBlocks.sort((a, b) => b.count - a.count);
            
            // 保存处理结果
            lastProcessedResult = {
                result,
                timeTaken,
                totalBlocks,
                keptBlocks: seenKeys.size,
                removedBlocks: totalBlocks - seenKeys.size,
                duplicateBlocks
            };
            
            // 更新UI
            outputText.value = result;
            processTime.textContent = timeTaken;
            originalBlocks.textContent = totalBlocks;
            keptBlocks.textContent = seenKeys.size;
            removedBlocks.textContent = totalBlocks - seenKeys.size;
            
            updateLineCounts();
            
            // 隐藏进度指示器
            progressContainer.style.display = 'none';
            
            // 显示完成通知
            const message = `处理完成！删除了 ${totalBlocks - seenKeys.size} 个重复块，保留了 ${seenKeys.size} 个唯一块。耗时 ${timeTaken} 毫秒。`;
            showNotification(message);
        }
        
        // 开始处理
        processNextChunk();
    }
    
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
        
        // 清除高亮
        clearHighlights();
        
        showNotification('已清空所有内容！');
    });
    
    // 示例按钮点击事件
    exampleBtn.addEventListener('click', function() {
        const exampleText = `controller flexe-group 1
 bind controller flexe-200gi 0/1/0/1 phy-num 1
 group-number 1
!
controller mtn-fgclient 1
 bind mtn-client 1/301 fg-timeslot 0
 fgclient-number 1
 fg-oam
  bas send enable
 !
!
controller mtn-fgclient 2
 bind mtn-client 1/301 fg-timeslot 1
 fgclient-number 2
 fg-oam
  bas send enable
 !
!
controller flexe-group 1
 bind controller flexe-200gi 0/1/0/1 phy-num 1
 group-number 1
!
controller mtn-fgclient 1
 bind mtn-client 1/301 fg-timeslot 0
 fgclient-number 1
 fg-oam
  bas send enable
 !
!
controller mtn-fgclient 4
 bind mtn-client 1/301 fg-timeslot 3
 fgclient-number 4
 fg-oam
  bas send enable
 !
!
controller flexe-group 1
 bind controller flexe-200gi 0/1/0/1 phy-num 1
 group-number 1
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
    
    // 文件上传功能
    const fileInput = document.getElementById('file-input');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    
    fileUploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 检查文件大小（限制为100MB）
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            showNotification('文件太大！请选择小于100MB的文件。', true);
            fileInput.value = '';
            return;
        }
        
        // 检查文件类型
        const allowedExtensions = ['.txt', '.conf', '.cfg', '.config', '.log'];
        const fileName = file.name.toLowerCase();
        const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        
        if (!isValidExtension) {
            showNotification('不支持的文件类型！请选择.txt、.conf、.cfg、.config或.log文件。', true);
            fileInput.value = '';
            return;
        }
        
        // 显示文件信息
        showNotification(`正在读取文件: ${file.name} (${formatFileSize(file.size)})`);
        
        // 读取文件内容
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const fileContent = event.target.result;
            
            // 对于大文件，不显示在文本框中，直接处理
            const lineCount = fileContent.split('\n').length;
            
            if (lineCount > 50000) {
                // 大文件：不显示在输入框，直接处理
                showNotification(`文件读取完成，共 ${lineCount.toLocaleString()} 行。开始处理...`);
                
                // 清空输入框，避免卡死
                inputText.value = '';
                updateLineCounts();
                
                // 直接处理文件内容
                setTimeout(() => {
                    processTextDirectly(fileContent, keywordsInput.value);
                }, 100);
            } else {
                // 小文件：显示在输入框
                inputText.value = fileContent;
                updateLineCounts();
                showNotification(`文件已加载到输入框，共 ${lineCount} 行。`);
            }
            
            // 重置文件输入
            fileInput.value = '';
        };
        
        reader.onerror = function() {
            showNotification('文件读取失败！', true);
            fileInput.value = '';
        };
        
        reader.readAsText(file, 'UTF-8');
    });
    
    // 直接处理文本（不显示在输入框）
    function processTextDirectly(text, keywords) {
        const lineCount = text.split('\n').length;
        const isLargeFile = lineCount > 100000;
        const blockEndMarker = blockEndInput.value.trim() || '!';
        
        if (isLargeFile) {
            // 使用大文本处理模式
            processLargeText(text, keywords, blockEndMarker);
        } else {
            // 使用普通处理模式
            const processed = removeDuplicateBlocks(text, keywords, blockEndMarker);
            
            outputText.value = processed.result;
            
            // 更新统计信息
            processTime.textContent = processed.timeTaken;
            originalBlocks.textContent = processed.totalBlocks;
            keptBlocks.textContent = processed.keptBlocks;
            removedBlocks.textContent = processed.removedBlocks;
            
            updateLineCounts();
            
            const message = `处理完成！删除了 ${processed.removedBlocks} 个重复块，保留了 ${processed.keptBlocks} 个唯一块。`;
            showNotification(message);
        }
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 实时更新行数统计
    inputText.addEventListener('input', updateLineCounts);
    
    // 初始化时更新行数统计和行号
    updateLineCounts();
    initLineNumbers();
    
    // 注释掉自动保存功能 - 用户希望每次刷新显示默认值
    // let autoSaveTimer;
    // inputText.addEventListener('input', function() {
    //     clearTimeout(autoSaveTimer);
    //     autoSaveTimer = setTimeout(() => {
    //         localStorage.setItem('configDeduplicator_input', inputText.value);
    //         localStorage.setItem('configDeduplicator_keywords', keywordsInput.value);
    //     }, 1000);
    // });
    
    // 不再加载保存的内容，始终使用默认值
    // 但为了兼容性，先清除之前保存的内容
    localStorage.removeItem('configDeduplicator_input');
    localStorage.removeItem('configDeduplicator_keywords');
    
    // 设置默认值
    const defaultKeywords = 'controller, router, interface, route, tunnel-te, ioam';
    keywordsInput.value = defaultKeywords;
    
    // 输入框已经包含默认的实例文本（在HTML中），所以不需要额外设置
    
    // 注释掉自动处理示例文本的代码，让用户手动点击
    // 这样可以确保主题切换按钮在页面加载时立即可用
    // if (savedInput) {
    //     setTimeout(() => {
    //         processBtn.click();
    //     }, 500);
    // }
    
    // 主题切换功能
    let currentTheme = 'light';
    
    function initTheme() {
        console.log('初始化主题功能...');
        
        // 获取主题相关元素
        themeIcon = themeToggleBtn.querySelector('i');
        themeText = themeToggleBtn.querySelector('.theme-text');
        
        // 检查元素是否存在
        if (!themeToggleBtn) {
            console.error('主题切换按钮未找到');
            return;
        }
        
        if (!themeIcon) {
            console.error('主题图标未找到');
        }
        
        if (!themeText) {
            console.error('主题文本未找到');
        }
        
        console.log('主题元素:', { themeToggleBtn, themeIcon, themeText });
        
        // 检查本地存储中的主题设置
        const savedTheme = localStorage.getItem('configDeduplicator_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 设置初始主题
        currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        console.log('初始主题:', currentTheme);
        applyTheme(currentTheme);
        
        // 主题切换按钮点击事件
        themeToggleBtn.addEventListener('click', toggleTheme);
        
        console.log('主题功能初始化完成');
    }
    
    // 应用主题
    function applyTheme(theme) {
        console.log('应用主题:', theme);
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新按钮图标和文本
        if (theme === 'dark') {
            if (themeIcon) themeIcon.className = 'fas fa-sun';
            if (themeText) themeText.textContent = '浅色主题';
        } else {
            if (themeIcon) themeIcon.className = 'fas fa-moon';
            if (themeText) themeText.textContent = '暗色主题';
        }
    }
    
    // 全局主题切换函数
    function toggleTheme() {
        console.log('主题切换按钮被点击 - toggleTheme函数被调用');
        console.log('当前主题:', currentTheme);
        
        // 切换主题
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        console.log('切换到主题:', currentTheme);
        
        // 应用新主题
        applyTheme(currentTheme);
        
        // 保存到本地存储
        localStorage.setItem('configDeduplicator_theme', currentTheme);
        console.log('主题已保存到本地存储');
        
        // 显示通知
        showNotification(`已切换到${currentTheme === 'dark' ? '暗色' : '浅色'}主题`);
        
        // 调试：检查HTML元素属性
        console.log('HTML data-theme属性:', document.documentElement.getAttribute('data-theme'));
        console.log('主题图标:', themeIcon ? themeIcon.className : '未找到');
        console.log('主题文本:', themeText ? themeText.textContent : '未找到');
    }
    
    // 将函数暴露到全局作用域
    window.toggleTheme = toggleTheme;
    
    // 简单主题切换函数 - 供内联onclick调用
    window.simpleToggleTheme = function() {
        console.log('simpleToggleTheme函数被调用');
        
        // 直接获取当前主题
        const current = document.documentElement.getAttribute('data-theme');
        console.log('当前主题:', current);
        
        // 切换主题
        const newTheme = current === 'dark' ? 'light' : 'dark';
        console.log('新主题:', newTheme);
        
        // 直接设置属性
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // 更新按钮文本
        const themeIcon = document.querySelector('#theme-toggle i');
        const themeText = document.querySelector('#theme-toggle .theme-text');
        
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        if (themeText) {
            themeText.textContent = newTheme === 'dark' ? '浅色主题' : '暗色主题';
        }
        
        // 保存到本地存储
        localStorage.setItem('configDeduplicator_theme', newTheme);
        
        // 显示通知（使用现有的通知系统）
        showNotification(`已切换到${newTheme === 'dark' ? '暗色' : '浅色'}主题`);
    };
    
    // 导出详细结果按钮点击事件
    exportDetailsBtn.addEventListener('click', function() {
        if (!lastProcessedResult) {
            showNotification('请先处理文本以获取重复块信息！', true);
            return;
        }
        
        if (!lastProcessedResult.duplicateBlocks || lastProcessedResult.duplicateBlocks.length === 0) {
            showNotification('没有发现重复的文本块！', true);
            return;
        }
        
        // 获取选择的导出格式
        const exportFormat = exportFormatSelect.value;
        
        let report, mimeType, fileName, message;
        
        if (exportFormat === 'csv') {
            // 构建CSV报告
            report = buildDuplicateReportCSV(lastProcessedResult);
            mimeType = 'text/csv;charset=utf-8';
            fileName = 'duplicate_blocks_report_' + new Date().toISOString().slice(0, 10) + '.csv';
            message = '重复块详细报告已导出为CSV文件！';
        } else {
            // 构建JSON报告 - 使用.txt扩展名避免Windows安全阻止
            report = buildDuplicateReportJSON(lastProcessedResult);
            mimeType = 'application/json;charset=utf-8';
            fileName = 'duplicate_blocks_report_' + new Date().toISOString().slice(0, 10) + '.txt';
            message = '重复块详细报告已导出为JSON文件（.txt格式）！';
        }
        
        // 导出文件
        const blob = new Blob([report], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(message);
    });
    
    // 构建重复块详细报告（JSON格式）
    function buildDuplicateReportJSON(processedResult) {
        const report = {
            summary: {
                totalBlocks: processedResult.totalBlocks,
                keptBlocks: processedResult.keptBlocks,
                removedBlocks: processedResult.removedBlocks,
                processingTime: processedResult.timeTaken + ' ms',
                duplicateBlocksCount: processedResult.duplicateBlocks.length
            },
            duplicateBlocks: processedResult.duplicateBlocks.map(block => ({
                contentPreview: block.content.length > 100 ? block.content.substring(0, 100) + '...' : block.content,
                content: block.content,
                count: block.count,
                lineNumbers: block.lineNumbers,
                firstOccurrenceLine: block.firstOccurrenceLine
            })),
            statistics: {
                mostFrequentDuplicate: processedResult.duplicateBlocks.length > 0 ? {
                    count: processedResult.duplicateBlocks[0].count,
                    firstOccurrenceLine: processedResult.duplicateBlocks[0].firstOccurrenceLine
                } : null,
                totalDuplicateOccurrences: processedResult.duplicateBlocks.reduce((sum, block) => sum + (block.count - 1), 0)
            }
        };
        
        return JSON.stringify(report, null, 2);
    }
    
    // 构建重复块详细报告（CSV格式）
    function buildDuplicateReportCSV(processedResult) {
        // CSV头部 - 使用英文
        let csv = 'Duplicate Blocks Detailed Report\n\n';
        
        // 摘要部分 - 使用英文
        csv += 'Summary\n';
        csv += 'Total Blocks,' + processedResult.totalBlocks + '\n';
        csv += 'Kept Blocks,' + processedResult.keptBlocks + '\n';
        csv += 'Removed Blocks,' + processedResult.removedBlocks + '\n';
        csv += 'Processing Time (ms),' + processedResult.timeTaken + '\n';
        csv += 'Duplicate Blocks Count,' + processedResult.duplicateBlocks.length + '\n\n';
        
        // 重复块详情 - 使用英文
        csv += 'Duplicate Blocks Details\n';
        csv += 'No.,Count,First Occurrence Line,All Occurrence Lines,Content Preview\n';
        
        processedResult.duplicateBlocks.forEach((block, index) => {
            const lineNumbersStr = block.lineNumbers.join('; ');
            const contentPreview = block.content.length > 100 ? 
                block.content.substring(0, 100).replace(/"/g, '""') + '...' : 
                block.content.replace(/"/g, '""');
            
            // 处理CSV特殊字符：用双引号包裹包含逗号、换行符或双引号的内容
            const escapedContent = contentPreview.includes(',') || contentPreview.includes('\n') || contentPreview.includes('"') ?
                '"' + contentPreview + '"' : contentPreview;
            
            csv += `${index + 1},${block.count},${block.firstOccurrenceLine},"${lineNumbersStr}",${escapedContent}\n`;
        });
        
        // 统计信息 - 使用英文
        csv += '\nStatistics\n';
        if (processedResult.duplicateBlocks.length > 0) {
            csv += 'Most Frequent Duplicate Count,' + processedResult.duplicateBlocks[0].count + '\n';
            csv += 'Most Frequent Duplicate First Line,' + processedResult.duplicateBlocks[0].firstOccurrenceLine + '\n';
        } else {
            csv += 'Most Frequent Duplicate Count,0\n';
            csv += 'Most Frequent Duplicate First Line,N/A\n';
        }
        
        const totalDuplicateOccurrences = processedResult.duplicateBlocks.reduce((sum, block) => sum + (block.count - 1), 0);
        csv += 'Total Duplicate Occurrences,' + totalDuplicateOccurrences + '\n';
        
        // 添加UTF-8 BOM以解决中文乱码问题
        const BOM = '\uFEFF';
        return BOM + csv;
    }
    
    // 首先初始化主题功能
    initTheme();
    
    // 注释掉页面加载时的自动处理，让用户手动操作
    // 这样可以确保主题切换按钮立即响应
    // setTimeout(() => {
    //     if (!savedInput && inputText.value.trim()) {
    //         // 先等待一小段时间确保UI完全就绪
    //         setTimeout(() => {
    //             processBtn.click();
    //         }, 300);
    //     }
    // }, 500);
});
