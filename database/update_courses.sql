-- 更新课程表，添加时间字段
USE xuexitong;

-- 添加新字段（如果不存在）
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS week_day TINYINT COMMENT '星期几(1-7)',
ADD COLUMN IF NOT EXISTS start_time TIME COMMENT '开始时间',
ADD COLUMN IF NOT EXISTS end_time TIME COMMENT '结束时间';

-- 查看表结构
DESCRIBE courses;
