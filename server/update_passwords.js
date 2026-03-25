const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updatePasswords() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'xuexitong',
        password: '123456',
        database: 'xuexitong'
    });

    try {
        // 生成密码 '123456' 的 bcrypt 哈希
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        
        console.log('Generated password hash:', hashedPassword);
        
        // 更新吴老师的密码
        await connection.execute(
            'UPDATE users SET password = ? WHERE username = ?',
            [hashedPassword, 'T2024001']
        );
        console.log('Updated T2024001 password');
        
        // 更新所有2024开头的学生密码
        await connection.execute(
            'UPDATE users SET password = ? WHERE username LIKE ?',
            [hashedPassword, '2024%']
        );
        console.log('Updated all 2024 student passwords');
        
        // 验证更新
        const [rows] = await connection.execute(
            'SELECT username, LEFT(password, 30) as pwd FROM users WHERE username IN (?, ?)',
            ['T2024001', '20240001']
        );
        console.log('Updated passwords:', rows);
        
        // 测试密码验证
        const [userRows] = await connection.execute(
            'SELECT password FROM users WHERE username = ?',
            ['T2024001']
        );
        
        if (userRows.length > 0) {
            const isValid = await bcrypt.compare('123456', userRows[0].password);
            console.log('Password verification test:', isValid);
        }
        
        console.log('All passwords updated successfully!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

updatePasswords();
