# 创建50个测试学生
# 使用PowerShell直接调用MySQL

$password = "123456"
$classId = (mysql -u xuexitong -p$password -e "USE xuexitong; SELECT id FROM classes WHERE invite_code='WU2024';" --silent --skip-column-names)

Write-Host "Class ID: $classId"
Write-Host "Creating 50 students..."

for ($i = 2; $i -le 50; $i++) {
    $username = "2024{0:D4}" -f $i
    $name = "Student$i"
    $email = "student$i@test.com"
    $phone = "138{0:D8}" -f (Get-Random -Minimum 10000000 -Maximum 99999999)
    
    # 插入用户
    $userResult = mysql -u xuexitong -p$password -e "USE xuexitong; INSERT INTO users (username, password, role, name, email, phone, is_profile_complete, status) VALUES ('$username', '\$2a\$10\$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', '$name', '$email', '$phone', 1, 1); SELECT LAST_INSERT_ID();" --silent --skip-column-names
    
    # 插入学生信息
    mysql -u xuexitong -p$password -e "USE xuexitong; INSERT INTO student_profiles (user_id, student_id, class_name, department, major) VALUES ($userResult, '$username', 'Test Class 2024', 'Computer Science', 'Software Engineering');"
    
    # 加入班级
    mysql -u xuexitong -p$password -e "USE xuexitong; INSERT INTO class_students (class_id, student_id, status) VALUES ($classId, $userResult, 'active');"
    
    Write-Host "Created student $i/50: $username"
}

# 更新班级学生人数
mysql -u xuexitong -p$password -e "USE xuexitong; UPDATE classes SET student_count = 50 WHERE id = $classId;"

# 验证
$count = mysql -u xuexitong -p$password -e "USE xuexitong; SELECT COUNT(*) FROM class_students WHERE class_id = $classId;" --silent --skip-column-names
Write-Host "Total students in class: $count"
Write-Host "All students created successfully!"
