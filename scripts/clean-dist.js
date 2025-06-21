#!/usr/bin/env node

/**
 * Dist Directory Cleanup Script
 * 
 * distディレクトリのクリーンアップとメンテナンス
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const distDir = path.join(__dirname, '../dist');

async function getDirectorySize(dir) {
    let size = 0;
    
    if (!await fs.pathExists(dir)) {
        return 0;
    }
    
    const files = await fs.readdir(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
            size += await getDirectorySize(filePath);
        } else {
            size += stat.size;
        }
    }
    
    return size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function analyzeDirectory() {
    console.log('📊 distディレクトリを分析しています...\n');
    
    const dirs = ['themes', 'builds', 'archives'];
    let totalSize = 0;
    
    for (const dir of dirs) {
        const dirPath = path.join(distDir, dir);
        const size = await getDirectorySize(dirPath);
        totalSize += size;
        
        if (await fs.pathExists(dirPath)) {
            const files = await fs.readdir(dirPath);
            console.log(`📁 ${dir}/`);
            console.log(`   ファイル数: ${files.length}`);
            console.log(`   サイズ: ${formatBytes(size)}`);
            console.log('');
        }
    }
    
    console.log(`📊 合計サイズ: ${formatBytes(totalSize)}\n`);
}

async function cleanArchives(keepCount = 10) {
    const archivesDir = path.join(distDir, 'archives');
    
    if (!await fs.pathExists(archivesDir)) {
        console.log('アーカイブディレクトリが存在しません。');
        return;
    }
    
    const files = await fs.readdir(archivesDir);
    const zipFiles = files
        .filter(f => f.endsWith('.zip'))
        .sort()
        .reverse();
    
    if (zipFiles.length <= keepCount) {
        console.log(`アーカイブファイル数が${keepCount}以下のため、クリーンアップは不要です。`);
        return;
    }
    
    const toDelete = zipFiles.slice(keepCount);
    console.log(`🗑️  ${toDelete.length}個の古いアーカイブを削除します...`);
    
    for (const file of toDelete) {
        const filePath = path.join(archivesDir, file);
        await fs.remove(filePath);
        console.log(`   削除: ${file}`);
    }
}

async function cleanBuilds(keepDays = 7) {
    const buildsDir = path.join(distDir, 'builds');
    
    if (!await fs.pathExists(buildsDir)) {
        console.log('ビルドディレクトリが存在しません。');
        return;
    }
    
    const files = await fs.readdir(buildsDir);
    const now = Date.now();
    const maxAge = keepDays * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    for (const file of files) {
        if (file.includes('latest')) continue;
        
        const filePath = path.join(buildsDir, file);
        const stat = await fs.stat(filePath);
        const age = now - stat.mtime.getTime();
        
        if (age > maxAge) {
            await fs.remove(filePath);
            deletedCount++;
            console.log(`   削除: ${file} (${Math.floor(age / (24 * 60 * 60 * 1000))}日前)`);
        }
    }
    
    if (deletedCount > 0) {
        console.log(`🗑️  ${deletedCount}個の古いビルドファイルを削除しました。`);
    } else {
        console.log(`${keepDays}日以内のビルドファイルのみのため、クリーンアップは不要です。`);
    }
}

async function resetDist() {
    console.log('⚠️  警告: これによりdistディレクトリの全内容が削除されます！');
    
    const answer = await new Promise(resolve => {
        rl.question('続行しますか？ (yes/no): ', resolve);
    });
    
    if (answer.toLowerCase() !== 'yes') {
        console.log('キャンセルしました。');
        return;
    }
    
    console.log('🗑️  distディレクトリをリセットしています...');
    await fs.remove(distDir);
    
    // ディレクトリ構造を再作成
    const dirs = [
        distDir,
        path.join(distDir, 'themes'),
        path.join(distDir, 'builds'),
        path.join(distDir, 'archives')
    ];
    
    for (const dir of dirs) {
        await fs.ensureDir(dir);
    }
    
    // .gitkeepファイルを作成
    for (const subdir of ['themes', 'builds', 'archives']) {
        const gitkeepPath = path.join(distDir, subdir, '.gitkeep');
        await fs.writeFile(gitkeepPath, '');
    }
    
    console.log('✅ distディレクトリをリセットしました。');
}

async function main() {
    console.log('🧹 Dist Directory Cleanup Tool\n');
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    try {
        switch (command) {
            case 'analyze':
                await analyzeDirectory();
                break;
                
            case 'clean-archives':
                const keepCount = parseInt(args[1]) || 10;
                await cleanArchives(keepCount);
                break;
                
            case 'clean-builds':
                const keepDays = parseInt(args[1]) || 7;
                await cleanBuilds(keepDays);
                break;
                
            case 'clean-all':
                await cleanArchives(10);
                await cleanBuilds(7);
                break;
                
            case 'reset':
                await resetDist();
                break;
                
            default:
                console.log('使用方法:');
                console.log('  node clean-dist.js analyze              - ディレクトリ分析');
                console.log('  node clean-dist.js clean-archives [数]   - 古いアーカイブを削除（デフォルト: 10個保持）');
                console.log('  node clean-dist.js clean-builds [日数]   - 古いビルドを削除（デフォルト: 7日保持）');
                console.log('  node clean-dist.js clean-all            - アーカイブとビルドをクリーンアップ');
                console.log('  node clean-dist.js reset                - distディレクトリを完全リセット');
        }
    } catch (error) {
        console.error('❌ エラー:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    main();
}