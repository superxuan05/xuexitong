const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'xuexitong',
    password: '123456',
    database: 'xuexitong'
});

connection.connect(err => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    console.log('Connected to MySQL');
    
    // 获取班级ID
    connection.query("SELECT id FROM classes WHERE invite_code = 'WU2024'", (err, classRows) => {
        if (err) {
            console.error('Error getting class:', err);
            connection.end();
            return;
        }
        
        if (classRows.length === 0) {
            console.error('Class not found');
            connection.end();
            return;
        }
        
        const classId = classRows[0].id;
        console.log('Class ID:', classId);
        
        let completed = 0;
        const total = 49; // 第1个已创建
        
        // 批量创建49个学生
        for (let i = 2; i <= 50; i++) {
            const username = `2024${String(i).padStart(4, '0')}`;
            const name = `Student${i}`;
            const email = `student${i}@test.com`;
            const phone = `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;

            connection.query(
                `INSERT INTO users (username, password, role, name, email, phone, is_profile_complete, status) 
                 VALUES (?, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', ?, ?, ?, 1, 1)`,
                [username, name, email, phone],
                (err, userResult) => {
                    if (err) {
                        console.error(`Error creating user ${i}:`, err);
                        completed++;
                        return;
                    }

                    const userId = userResult.insertId;

                    connection.query(
                        `INSERT INTO student_profiles (user_id, student_id, class_name, department, major) 
                         VALUES (?, ?, 'Test Class 2024', 'Computer Science', 'Software Engineering')`,
                        [userId, username],
                        (err) => {
                            if (err) console.error(`Error creating profile ${i}:`, err);
                        }
                    );

                    connection.query(
                        `INSERT INTO class_students (class_id, student_id, status) VALUES (?, ?, 'active')`,
                        [classId, userId],
                        (err) => {
                            if (err) console.error(`Error adding to class ${i}:`, err);
                        }
                    );

                    completed++;
                    console.log(`Created student ${i}/50: ${username}`);
                    
                    if (completed === total) {
                        connection.query('UPDATE classes SET student_count = 50 WHERE id = ?', [classId]);
                        console.log('All students created!');
                        
                        connection.query('SELECT COUNT(*) as count FROM class_students WHERE class_id = ?', [classId], (err, rows) => {
                            console.log(`Total students in class: ${rows[0].count}`);
                            connection.end();
                        });
                    }
                }
            );
        }
    });
});
