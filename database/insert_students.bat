@echo off
chcp 65001 >nul
echo Creating 50 test students...

mysql -u xuexitong -p123456 -e "USE xuexitong; SET @class_id = (SELECT id FROM classes WHERE invite_code='WU2024');"

for /L %%i in (1,1,50) do (
    set num=000%%i
    set num=!num:~-4!
    mysql -u xuexitong -p123456 -e "USE xuexitong; INSERT INTO users (username, password, role, name, email, phone, is_profile_complete, status) VALUES ('2024!num!', '\$2a\$10\$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', CONCAT('Student', %%i), CONCAT('student', %%i, '@test.com'), CONCAT('138', FLOOR(RAND() * 100000000)), 1, 1); SET @stu_id = LAST_INSERT_ID(); INSERT INTO student_profiles (user_id, student_id, class_name, department, major) VALUES (@stu_id, CONCAT('2024', LPAD(%%i, 4, '0')), 'Test Class 2024', 'Computer Science', 'Software Engineering'); SET @class_id = (SELECT id FROM classes WHERE invite_code='WU2024'); INSERT INTO class_students (class_id, student_id, status) VALUES (@class_id, @stu_id, 'active');"
)

echo Done!
pause
